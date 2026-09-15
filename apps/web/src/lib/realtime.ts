// Browser port of apps/ios/App/LiveTransport.swift — WebRTC audio +
// `oai-events` datachannel against the live session endpoint, relayed through
// our server (which holds the API key).

export type ConnectionState = 'idle' | 'connecting' | 'active' | 'closing' | 'ended' | 'failed'

export interface LiveEvent {
  type: string
  [key: string]: unknown
}

export class TransportError extends Error {
  constructor(public code: 'microphone' | 'connection' | 'timeout') {
    super(code)
  }
  get description(): string {
    switch (this.code) {
      case 'microphone':
        return 'Allow microphone access to start a conversation.'
      case 'timeout':
        return 'The voice connection took too long. Please try again.'
      default:
        return 'The voice connection couldn’t be established. Check your connection and try again.'
    }
  }
}

export class LiveTransport {
  onEvent?: (event: LiveEvent) => void
  onLevels?: (input: number, output: number) => void
  onFailure?: (message: string) => void

  private pc: RTCPeerConnection | null = null
  private channel: RTCDataChannel | null = null
  private localTrack: MediaStreamTrack | null = null
  private localStream: MediaStream | null = null
  private audioEl: HTMLAudioElement | null = null
  private meterTimer: ReturnType<typeof setInterval> | null = null
  private attempt = ''
  started = false
  isMuted = false
  private closing = false
  private lastInput = 0
  private lastOutput = 0

  async connect(create: (sdp: string) => Promise<{ sdp: string; session?: Record<string, unknown> }>): Promise<void> {
    this.disconnect()
    this.closing = false
    const token = crypto.randomUUID()
    this.attempt = token

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      })
    } catch {
      throw new TransportError('microphone')
    }
    if (this.attempt !== token) {
      stream.getTracks().forEach((t) => t.stop())
      throw new DOMException('cancelled', 'AbortError')
    }
    this.localStream = stream
    const track = stream.getAudioTracks()[0]
    this.localTrack = track
    this.isMuted = false

    const pc = new RTCPeerConnection()
    this.pc = pc
    pc.addTrack(track, stream)

    // Remote audio → hidden <audio> element.
    this.audioEl = document.createElement('audio')
    this.audioEl.autoplay = true
    pc.ontrack = (e) => {
      if (this.audioEl) this.audioEl.srcObject = e.streams[0] ?? new MediaStream([e.track])
    }
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed' && !this.closing) {
        this.onFailure?.('The network connection was lost. Tap to start a new conversation.')
      }
    }

    const channel = pc.createDataChannel('oai-events', { ordered: true })
    this.channel = channel
    channel.onmessage = (e) => {
      try {
        const json = JSON.parse(e.data as string) as LiveEvent
        if (json.type === 'session.started') this.started = true
        this.onEvent?.(json)
      } catch {
        /* malformed event ignored */
      }
    }
    channel.onclose = () => {
      if (!this.closing && channel === this.channel) {
        this.onFailure?.('The voice connection ended unexpectedly. Your conversation has been saved.')
      }
    }

    const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false })
    await pc.setLocalDescription(offer)

    const deadline = Date.now() + 10_000
    while (pc.iceGatheringState !== 'complete') {
      await sleep(100)
      if (this.attempt !== token) throw new DOMException('cancelled', 'AbortError')
      if (Date.now() > deadline) throw new TransportError('timeout')
    }
    const sdp = pc.localDescription?.sdp
    if (!sdp) throw new TransportError('connection')

    const result = await create(sdp)
    if (this.attempt !== token) throw new DOMException('cancelled', 'AbortError')
    if (result.session) {
      this.onEvent?.({ type: 'mural.session.created', session: result.session })
    }
    await pc.setRemoteDescription({ type: 'answer', sdp: result.sdp })

    const readyDeadline = Date.now() + 20_000
    while (!this.started) {
      await sleep(100)
      if (this.attempt !== token) throw new DOMException('cancelled', 'AbortError')
      if (Date.now() > readyDeadline) throw new TransportError('timeout')
    }
    this.startMetering()
  }

  send(event: Record<string, unknown>): boolean {
    const channel = this.channel
    if (!channel || channel.readyState !== 'open') return false
    try {
      channel.send(JSON.stringify(event))
      return true
    } catch {
      return false
    }
  }

  mute(muted: boolean): void {
    this.isMuted = muted
    if (this.localTrack) this.localTrack.enabled = !muted
    this.send({
      type: muted ? 'session.input_audio.mute' : 'session.input_audio.unmute',
      event_id: crypto.randomUUID(),
    })
  }

  close(): void {
    this.closing = true
    if (this.localTrack) this.localTrack.enabled = false
    this.isMuted = true
    this.send({ type: 'session.close', event_id: crypto.randomUUID() })
  }

  disconnect(): void {
    this.attempt = crypto.randomUUID()
    if (this.meterTimer) {
      clearInterval(this.meterTimer)
      this.meterTimer = null
    }
    this.started = false
    this.closing = true
    if (this.localTrack) this.localTrack.enabled = false
    this.localTrack = null
    this.localStream?.getTracks().forEach((t) => t.stop())
    this.localStream = null
    if (this.channel) {
      this.channel.onclose = null
      this.channel.onmessage = null
      this.channel.close()
      this.channel = null
    }
    if (this.pc) {
      this.pc.ontrack = null
      this.pc.oniceconnectionstatechange = null
      this.pc.close()
      this.pc = null
    }
    if (this.audioEl) {
      this.audioEl.srcObject = null
      this.audioEl = null
    }
    this.lastInput = 0
    this.lastOutput = 0
    this.onLevels?.(0, 0)
  }

  private startMetering(): void {
    if (this.meterTimer) clearInterval(this.meterTimer)
    this.meterTimer = setInterval(async () => {
      const pc = this.pc
      if (!pc || !this.started) return
      try {
        const report = await pc.getStats()
        let input = 0
        let output = 0
        report.forEach((stat) => {
          const level = (stat as { audioLevel?: number }).audioLevel ?? 0
          if (stat.type === 'inbound-rtp') output = Math.max(output, level)
          if (stat.type === 'media-source') input = Math.max(input, level)
        })
        this.lastInput = this.lastInput * 0.35 + Math.min(1, input * 4) * 0.65
        this.lastOutput = this.lastOutput * 0.35 + Math.min(1, output * 4) * 0.65
        this.onLevels?.(this.isMuted ? 0 : this.lastInput, this.lastOutput)
      } catch {
        /* stats unavailable this tick */
      }
    }, 100)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
