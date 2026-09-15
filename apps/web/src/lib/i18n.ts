// Interface-language layer. Every user-facing UI string lives here keyed by
// dot-path; the learning/meaning content (greetings, themes, prompts) stays in
// the language modules. `useT()` reads Preferences.interfaceLanguage and
// re-renders on change. Add a language by adding a dict — TS enforces that it
// covers every key in `en`.

import type { LanguageModule } from './languages'

export const INTERFACE_LANGUAGES = [
  { id: 'en', name: 'English', nativeName: 'English' },
  { id: 'fr', name: 'French', nativeName: 'Français' },
  { id: 'pt-BR', name: 'Brazilian Portuguese', nativeName: 'Português (Brasil)' },
] as const

export type InterfaceLanguage = (typeof INTERFACE_LANGUAGES)[number]['id']

export const DEFAULT_INTERFACE_LANGUAGE: InterfaceLanguage = 'fr'

/// Which meaning language to preselect for a given interface language.
export const INTERFACE_TO_MEANING: Record<InterfaceLanguage, string> = {
  en: 'English',
  fr: 'French',
  'pt-BR': 'Brazilian Portuguese',
}

export function asInterfaceLanguage(value: string | undefined): InterfaceLanguage {
  return INTERFACE_LANGUAGES.some((l) => l.id === value)
    ? (value as InterfaceLanguage)
    : DEFAULT_INTERFACE_LANGUAGE
}

const en = {
  // Login
  'login.title': 'A quiet place to practise.',
  'login.subtitle': 'This Mural is private. Enter the shared password.',
  'login.password': 'Password',
  'login.continue': 'Continue',
  'login.opening': 'Opening…',
  'login.error': 'Couldn’t sign in.',

  // Shell
  'tab.talk': 'Talk',
  'tab.themes': 'Themes',
  'tab.words': 'Words',
  'shell.settings': 'Settings',
  'shell.warming': 'Warming up…',
  'alert.title': 'A little interruption',
  'alert.ok': 'OK',

  // Onboarding
  'ob.step': 'Step {n} of {total}',
  'ob.interfaceTitle': 'Choose your language.',
  'ob.interfaceHint': 'You can change this later in Settings.',
  'ob.meaningTitle': 'A little help,\nin your language.',
  'ob.meaningSub': 'Choose the language you read most easily for meanings.',
  'ob.meaningPicker': 'Subtitle language',
  'ob.meaningHint': 'Turn meanings on whenever you need a hand.',
  'ob.targetTitle': 'What would you\nlike to speak?',
  'ob.speaks': 'Mural speaks {language}.',
  'ob.continue': 'Continue',
  'ob.agree': 'Agree and continue',
  'ob.footnote0': 'We’ll find your pace through conversation.',
  'ob.footnoteLast': 'You can change all of this in Settings.',
  'ob.backInterface': 'Back to interface language',
  'ob.backMeaning': 'Back to subtitle language',

  // Consent
  'consent.summary':
    'With your permission, Mural sends audio and selected text to OpenAI to provide conversations and meanings. Provider retention rules apply.',
  'consent.title': 'Before we talk.',
  'consent.body':
    'Your learning record stays with this Mural. Mural does not save raw audio. You can keep browsing your saved words and conversations without agreeing.',
  'consent.agree': 'Agree and continue',
  'consent.notNow': 'Not now',
  'consent.privacy': 'Privacy policy',

  // Talk
  'talk.untitledTheme': 'A little everyday {language}',
  'status.idle': 'Ready when you are',
  'status.connecting': 'Getting comfortable…',
  'status.speaking': 'Mural is speaking',
  'status.listening': 'I’m listening',
  'status.waiting': 'Take your time',
  'status.closing': 'Saving our conversation…',
  'status.ended': 'Until next time',
  'status.failed': 'Let’s try again',
  'mic.on': 'Microphone on',
  'mic.muted': 'Microphone muted',
  'mic.connecting': 'Connecting microphone',
  'mic.off': 'Microphone off',
  'talk.translating': 'Finding the meaning…',
  'talk.retryMeaning': 'Try meaning again',
  'talk.checking': 'Checking that for you…',
  'talk.sources': 'Sources',
  'talk.meaning': 'Meaning',
  'talk.showMeanings': 'Show meaning subtitles',
  'talk.hideMeanings': 'Hide meaning subtitles',
  'talk.mute': 'Mute microphone',
  'talk.unmute': 'Unmute microphone',
  'talk.start': 'Start conversation',
  'talk.end': 'End',
  'talk.endAria': 'End conversation',
  'talk.transcriptAria': 'Conversation transcript',
  'talk.transcript': 'Transcript',
  'talk.typeInstead': 'Type instead',
  'talk.help': 'A little help',
  'talk.replyHint': 'Reply in whichever language comes to you.',
  'talk.new': 'New conversation',

  // Notices
  'notice.simpler': 'Mural will make that a little simpler.',
  'notice.saved': 'Conversation saved. Final voice usage is unconfirmed.',
  'notice.updateFailed': 'A conversation update couldn’t be sent. You can keep speaking.',
  'notice.updateRejected':
    'A voice update was rejected. If Mural stops responding, end this conversation and start again.',
  'notice.timeLimit': 'You’ve reached your conversation time limit.',
  'notice.idleEnd': 'Mural ended this quiet session to avoid running up usage.',
  'notice.lookupIncomplete': 'The lookup wasn’t completed.',

  // Typed reply
  'typed.title': 'Say it your way.',
  'typed.placeholder': 'Reply in {language} or another language',
  'typed.send': 'Send reply',
  'typed.sending': 'Sending…',

  // Word lookup + detail
  'lookup.title': 'A little meaning',
  'lookup.finding': 'Finding the meaning…',
  'word.title': 'Word',
  'word.uses': '{count} independent uses · Last seen {date}',
  'word.remove': 'Remove from my words',
  'word.new': 'New',
  'word.fragile': 'Fragile',
  'word.growing': 'Growing',
  'word.steady': 'Steady',
  'word.expl0': 'Heard or used with support. Try using it in your own words.',
  'word.expl1': 'Used independently. We’ll bring it back soon.',
  'word.expl2': 'Recalled on different days. Still worth revisiting.',
  'word.expl3': 'Recalled across days and contexts. Strength can fade with time.',

  // Topic sheet
  'topic.title': 'The world today',
  'topic.heading': 'A fresh conversation.',
  'topic.sub': 'What would you like to talk about?',
  'topic.find': 'Find a topic',
  'topic.finding': 'Finding something interesting…',
  'topic.talk': 'Talk about this',
  'topic.footnote':
    'Search uses your hosted OpenAI account. Sources stay attached to the topic.',

  // Themes
  'themes.eyebrow': 'A place to begin',
  'themes.title': 'What’s on\nyour mind?',
  'themes.subtitle': 'Same friend. Somewhere new.',
  'themes.justTalk': 'Just talk',
  'themes.search': 'Find a conversation',
  'themes.all': 'All',
  'themes.cat.everyday': 'Everyday',
  'themes.cat.connection': 'Connection',
  'themes.cat.localLife': 'Local life',
  'themes.cat.interests': 'Interests',
  'themes.none': 'No conversations match “{search}”.',

  // Words
  'words.eyebrow': 'Little by little · {language}',
  'words.title': 'Your words.',
  'words.subtitle': 'Familiar words, ready for another conversation.',
  'words.search': 'Find a word',
  'words.emptySearchTitle': 'No matching words yet.',
  'words.emptyTitle': 'They’ll grow from here.',
  'words.emptySearchBody': 'Try another {language} word or {meaning} meaning.',
  'words.emptyBody':
    'As we talk, useful words and phrases find a home here. Their strength grows when you recall them over time.',
  'words.legend': '{n} · {label}',
  'words.legendNote':
    'The bars estimate spoken recall, not permanent mastery. Using a word with visible meanings counts as supported practice.',
  'words.capabilities': 'Finding your voice',
  'words.capNote':
    'Observed across conversations. These are provisional, not formal level certificates.',
  'words.past': 'Past conversations',

  // Transcript + history
  'transcript.you': 'YOU',
  'transcript.mural': 'MURAL',
  'transcript.title': 'Our conversation',
  'transcript.empty': 'Your conversation will appear here.',
  'transcript.emptyIdle': 'Start a conversation and your words will appear here.',
  'transcript.edit': 'Edit',
  'transcript.deleted': 'This conversation was deleted.',
  'transcript.sources': 'Sources · {date}',
  'edit.title': 'What you said',
  'edit.body':
    'Correct a misheard phrase. Learning evidence from the old wording will be removed; the original remains in your backup history.',
  'edit.save': 'Save',
  'history.title': 'Past conversations',
  'history.empty': 'Your {language} conversations will appear here.',
  'history.delete': 'Delete',
  'delete.title': 'Delete conversation?',
  'delete.body': 'Delete this conversation and its learning evidence?',
  'delete.confirm': 'Delete conversation',

  // Settings
  'settings.title': 'Make yourself comfortable',
  'settings.pace': 'Just your pace',
  'settings.paceFooter':
    'Each language keeps its own words and progress. Mural finds your pace through conversation.',
  'settings.paceFooterRunning':
    'End this conversation to switch languages. Each language keeps its own words and progress.',
  'settings.learningLanguage': 'Learning language',
  'settings.interfaceLanguage': 'Interface language',
  'settings.meaningSubtitles': 'Meaning subtitles',
  'settings.meaningLanguage': 'Meaning language',
  'settings.corrections': 'Corrections',
  'settings.correctionsValue': 'Gently, as we talk',
  'settings.interests': 'A few things you enjoy',
  'settings.comfort': 'Keep it comfortable',
  'settings.comfortFooter':
    'Voice estimate uses $0.05/min as of 11 September 2026. Translation, teaching and search cost extra. Interrupted requests can be billed without a usage record here. Your OpenAI dashboard is authoritative. The time limit is local, not a billing cap.',
  'settings.limit': 'Conversation limit',
  'settings.minutes': '{m} minutes',
  'settings.voiceTime': 'Recorded voice time',
  'settings.voiceTimeValue': '{m} min {s} sec',
  'settings.voiceEstimate': 'Voice estimate',
  'settings.searchCalls': 'Search calls recorded',
  'settings.openaiUsage': 'OpenAI usage and billing',
  'settings.data': 'Your words belong to you',
  'settings.dataFooter':
    'Backups include transcripts and learning evidence, never account credentials. Import adds conversations with new IDs. Existing conversations stay unchanged.',
  'settings.export': 'Export learning backup',
  'settings.import': 'Import learning backup',
  'settings.imported': 'Your backup has been imported.',
  'settings.importFailed': 'Import failed.',
  'settings.deleteAll': 'Delete all conversations and learning',
  'settings.help': 'Help and privacy',
  'settings.privacy': 'Privacy policy',
  'settings.terms': 'Terms of use',
  'settings.support': 'Contact support',
  'settings.about': 'About this copy',
  'settings.aboutBody':
    'Mural web 0.1 · Voice: GPT-Live-1 · Teacher: GPT-5.6 Luna. Audio and selected text go to OpenAI while you practise; raw audio is never saved.',
  'settings.openaiData': 'OpenAI data controls',
  'settings.signin': 'Sign in',
  'settings.signout': 'Sign out of this device',
  'settings.signoutTitle': 'Sign out?',
  'settings.signoutBody':
    'You’ll need the shared password to sign back in. Your learning record stays on the server.',
  'settings.signoutConfirm': 'Sign out',
  'settings.deleteAllTitle': 'Delete all learning data?',
  'settings.deleteAllBody':
    'This removes conversations, vocabulary and progress. Export a backup first if you want to keep them. Your preferences remain.',
  'settings.deleteAllConfirm': 'Delete all learning data',

  // Misc
  'session.defaultTitle': 'A little {language}',
  'pinyin.hide': 'Hide pinyin',
  'pinyin.show': 'Show pinyin',
  'level.new': 'Getting to know you',
  'level.pace': 'Finding your pace',
  'error.saveProgress': 'Mural couldn’t save your progress. Please export a backup and try again.',
} as const

export type StringKey = keyof typeof en
export type Params = Record<string, string | number>

const ptBR: Record<StringKey, string> = {
  'login.title': 'Um lugar tranquilo para praticar.',
  'login.subtitle': 'Este Mural é privado. Digite a senha compartilhada.',
  'login.password': 'Senha',
  'login.continue': 'Continuar',
  'login.opening': 'Abrindo…',
  'login.error': 'Não foi possível entrar.',

  'tab.talk': 'Conversa',
  'tab.themes': 'Temas',
  'tab.words': 'Palavras',
  'shell.settings': 'Ajustes',
  'shell.warming': 'Aquecendo…',
  'alert.title': 'Uma pequena interrupção',
  'alert.ok': 'OK',

  'ob.step': 'Etapa {n} de {total}',
  'ob.interfaceTitle': 'Escolha seu idioma.',
  'ob.interfaceHint': 'Você pode mudar isso depois nos Ajustes.',
  'ob.meaningTitle': 'Uma ajudinha,\nno seu idioma.',
  'ob.meaningSub': 'Escolha o idioma em que você lê com mais facilidade para ver significados.',
  'ob.meaningPicker': 'Idioma das legendas',
  'ob.meaningHint': 'Ative os significados sempre que precisar de uma mão.',
  'ob.targetTitle': 'O que você gostaria\nde falar?',
  'ob.speaks': 'O Mural fala {language}.',
  'ob.continue': 'Continuar',
  'ob.agree': 'Concordar e continuar',
  'ob.footnote0': 'Vamos encontrar seu ritmo pela conversa.',
  'ob.footnoteLast': 'Você pode mudar tudo isso nos Ajustes.',
  'ob.backInterface': 'Voltar ao idioma da interface',
  'ob.backMeaning': 'Voltar ao idioma das legendas',

  'consent.summary':
    'Com sua permissão, o Mural envia áudio e texto selecionado para a OpenAI para oferecer conversas e significados. Aplicam-se as regras de retenção do provedor.',
  'consent.title': 'Antes de conversarmos.',
  'consent.body':
    'Seu histórico de aprendizado fica neste Mural. O Mural não salva áudio bruto. Você pode continuar navegando pelas suas palavras e conversas salvas sem concordar.',
  'consent.agree': 'Concordar e continuar',
  'consent.notNow': 'Agora não',
  'consent.privacy': 'Política de privacidade',

  'talk.untitledTheme': 'Um pouco de {language} no dia a dia',
  'status.idle': 'Quando você quiser',
  'status.connecting': 'Se acomodando…',
  'status.speaking': 'Mural está falando',
  'status.listening': 'Estou ouvindo',
  'status.waiting': 'Não tenha pressa',
  'status.closing': 'Salvando nossa conversa…',
  'status.ended': 'Até a próxima',
  'status.failed': 'Vamos tentar de novo',
  'mic.on': 'Microfone ligado',
  'mic.muted': 'Microfone silenciado',
  'mic.connecting': 'Conectando microfone',
  'mic.off': 'Microfone desligado',
  'talk.translating': 'Buscando o significado…',
  'talk.retryMeaning': 'Tentar o significado de novo',
  'talk.checking': 'Verificando para você…',
  'talk.sources': 'Fontes',
  'talk.meaning': 'Significado',
  'talk.showMeanings': 'Mostrar legendas de significado',
  'talk.hideMeanings': 'Ocultar legendas de significado',
  'talk.mute': 'Silenciar microfone',
  'talk.unmute': 'Reativar microfone',
  'talk.start': 'Começar conversa',
  'talk.end': 'Encerrar',
  'talk.endAria': 'Encerrar conversa',
  'talk.transcriptAria': 'Transcrição da conversa',
  'talk.transcript': 'Transcrição',
  'talk.typeInstead': 'Digitar',
  'talk.help': 'Uma ajudinha',
  'talk.replyHint': 'Responda no idioma que vier naturalmente.',
  'talk.new': 'Nova conversa',

  'notice.simpler': 'Mural vai simplificar um pouco.',
  'notice.saved': 'Conversa salva. O uso final de voz não está confirmado.',
  'notice.updateFailed':
    'Não foi possível enviar uma atualização da conversa. Você pode continuar falando.',
  'notice.updateRejected':
    'Uma atualização de voz foi rejeitada. Se o Mural parar de responder, encerre esta conversa e comece outra.',
  'notice.timeLimit': 'Você chegou ao limite de tempo da conversa.',
  'notice.idleEnd': 'Mural encerrou esta sessão parada para evitar uso desnecessário.',
  'notice.lookupIncomplete': 'A busca não foi concluída.',

  'typed.title': 'Diga do seu jeito.',
  'typed.placeholder': 'Responda em {language} ou outro idioma',
  'typed.send': 'Enviar resposta',
  'typed.sending': 'Enviando…',

  'lookup.title': 'Um pouco de significado',
  'lookup.finding': 'Buscando o significado…',
  'word.title': 'Palavra',
  'word.uses': '{count} usos independentes · Visto pela última vez em {date}',
  'word.remove': 'Remover das minhas palavras',
  'word.new': 'Nova',
  'word.fragile': 'Frágil',
  'word.growing': 'Crescendo',
  'word.steady': 'Firme',
  'word.expl0': 'Ouvida ou usada com ajuda. Tente usar com suas próprias palavras.',
  'word.expl1': 'Usada sozinha. Vamos trazê-la de volta em breve.',
  'word.expl2': 'Lembrada em dias diferentes. Ainda vale revisitar.',
  'word.expl3': 'Lembrada em vários dias e contextos. A força pode diminuir com o tempo.',

  'topic.title': 'O mundo hoje',
  'topic.heading': 'Uma conversa nova.',
  'topic.sub': 'Sobre o que você gostaria de conversar?',
  'topic.find': 'Encontrar um tema',
  'topic.finding': 'Procurando algo interessante…',
  'topic.talk': 'Conversar sobre isso',
  'topic.footnote': 'A busca usa sua conta OpenAI hospedada. As fontes ficam anexadas ao tema.',

  'themes.eyebrow': 'Um lugar para começar',
  'themes.title': 'O que passa\npela sua cabeça?',
  'themes.subtitle': 'Um novo cenário, a mesma companhia.',
  'themes.justTalk': 'Só conversar',
  'themes.search': 'Encontrar uma conversa',
  'themes.all': 'Todos',
  'themes.cat.everyday': 'Cotidiano',
  'themes.cat.connection': 'Conexão',
  'themes.cat.localLife': 'Vida local',
  'themes.cat.interests': 'Interesses',
  'themes.none': 'Nenhuma conversa corresponde a “{search}”.',

  'words.eyebrow': 'Pouco a pouco · {language}',
  'words.title': 'Suas palavras.',
  'words.subtitle': 'Palavras conhecidas, prontas para outra conversa.',
  'words.search': 'Encontrar uma palavra',
  'words.emptySearchTitle': 'Nenhuma palavra correspondente ainda.',
  'words.emptyTitle': 'Elas vão crescer daqui.',
  'words.emptySearchBody': 'Tente outra palavra em {language} ou significado em {meaning}.',
  'words.emptyBody':
    'Conforme conversamos, palavras e frases úteis criam um lar aqui. A força delas cresce quando você se lembra delas ao longo do tempo.',
  'words.legend': '{n} · {label}',
  'words.legendNote':
    'As barras estimam a recordação falada, não o domínio permanente. Usar uma palavra com significados visíveis conta como prática com apoio.',
  'words.capabilities': 'Encontrando sua voz',
  'words.capNote':
    'Observado ao longo das conversas. São provisórios, não certificados formais de nível.',
  'words.past': 'Conversas anteriores',

  'transcript.you': 'VOCÊ',
  'transcript.mural': 'MURAL',
  'transcript.title': 'Nossa conversa',
  'transcript.empty': 'Sua conversa vai aparecer aqui.',
  'transcript.emptyIdle': 'Comece uma conversa e suas palavras aparecerão aqui.',
  'transcript.edit': 'Editar',
  'transcript.deleted': 'Esta conversa foi excluída.',
  'transcript.sources': 'Fontes · {date}',
  'edit.title': 'O que você disse',
  'edit.body':
    'Corrija uma frase mal compreendida. As evidências de aprendizado da redação antiga serão removidas; o original permanece no histórico do seu backup.',
  'edit.save': 'Salvar',
  'history.title': 'Conversas anteriores',
  'history.empty': 'Suas conversas em {language} vão aparecer aqui.',
  'history.delete': 'Excluir',
  'delete.title': 'Excluir conversa?',
  'delete.body': 'Excluir esta conversa e suas evidências de aprendizado?',
  'delete.confirm': 'Excluir conversa',

  'settings.title': 'Deixe tudo confortável',
  'settings.pace': 'No seu ritmo',
  'settings.paceFooter':
    'Cada idioma mantém suas próprias palavras e progresso. O Mural encontra seu ritmo pela conversa.',
  'settings.paceFooterRunning':
    'Encerre esta conversa para trocar de idioma. Cada idioma mantém suas próprias palavras e progresso.',
  'settings.learningLanguage': 'Idioma de aprendizado',
  'settings.interfaceLanguage': 'Idioma da interface',
  'settings.meaningSubtitles': 'Legendas de significado',
  'settings.meaningLanguage': 'Idioma dos significados',
  'settings.corrections': 'Correções',
  'settings.correctionsValue': 'Com leveza, durante a conversa',
  'settings.interests': 'Algumas coisas que você gosta',
  'settings.comfort': 'Deixe confortável',
  'settings.comfortFooter':
    'A estimativa de voz usa US$ 0,05/min conforme 11 de setembro de 2026. Tradução, ensino e busca custam à parte. Requisições interrompidas podem ser cobradas sem registro de uso aqui. Seu painel da OpenAI é a fonte definitiva. O limite de tempo é local, não um teto de cobrança.',
  'settings.limit': 'Limite de conversa',
  'settings.minutes': '{m} minutos',
  'settings.voiceTime': 'Tempo de voz gravado',
  'settings.voiceTimeValue': '{m} min {s} s',
  'settings.voiceEstimate': 'Estimativa de voz',
  'settings.searchCalls': 'Chamadas de busca registradas',
  'settings.openaiUsage': 'Uso e cobrança da OpenAI',
  'settings.data': 'Suas palavras pertencem a você',
  'settings.dataFooter':
    'Os backups incluem transcrições e evidências de aprendizado, nunca credenciais de conta. A importação adiciona conversas com novos IDs. As conversas existentes não mudam.',
  'settings.export': 'Exportar backup de aprendizado',
  'settings.import': 'Importar backup de aprendizado',
  'settings.imported': 'Seu backup foi importado.',
  'settings.importFailed': 'A importação falhou.',
  'settings.deleteAll': 'Excluir todas as conversas e o aprendizado',
  'settings.help': 'Ajuda e privacidade',
  'settings.privacy': 'Política de privacidade',
  'settings.terms': 'Termos de uso',
  'settings.support': 'Falar com o suporte',
  'settings.about': 'Sobre esta cópia',
  'settings.aboutBody':
    'Mural web 0.1 · Voz: GPT-Live-1 · Professor: GPT-5.6 Luna. Áudio e texto selecionado vão para a OpenAI enquanto você pratica; o áudio bruto nunca é salvo.',
  'settings.openaiData': 'Controles de dados da OpenAI',
  'settings.signin': 'Acesso',
  'settings.signout': 'Sair deste dispositivo',
  'settings.signoutTitle': 'Sair?',
  'settings.signoutBody':
    'Você vai precisar da senha compartilhada para entrar de novo. Seu histórico de aprendizado fica no servidor.',
  'settings.signoutConfirm': 'Sair',
  'settings.deleteAllTitle': 'Excluir todos os dados de aprendizado?',
  'settings.deleteAllBody':
    'Isso remove conversas, vocabulário e progresso. Exporte um backup antes se quiser mantê-los. Suas preferências permanecem.',
  'settings.deleteAllConfirm': 'Excluir todos os dados de aprendizado',

  'session.defaultTitle': 'Um pouco de {language}',
  'pinyin.hide': 'Ocultar pinyin',
  'pinyin.show': 'Mostrar pinyin',
  'level.new': 'Conhecendo você',
  'level.pace': 'Encontrando seu ritmo',
  'error.saveProgress':
    'Mural não conseguiu salvar seu progresso. Exporte um backup e tente de novo.',
}

const fr: Record<StringKey, string> = {
  'login.title': 'Un endroit calme pour pratiquer.',
  'login.subtitle': 'Ce Mural est privé. Saisis le mot de passe partagé.',
  'login.password': 'Mot de passe',
  'login.continue': 'Continuer',
  'login.opening': 'Ouverture…',
  'login.error': 'Connexion impossible.',

  'tab.talk': 'Parler',
  'tab.themes': 'Thèmes',
  'tab.words': 'Mots',
  'shell.settings': 'Réglages',
  'shell.warming': 'Préparation…',
  'alert.title': 'Une petite interruption',
  'alert.ok': 'OK',

  'ob.step': 'Étape {n} sur {total}',
  'ob.interfaceTitle': 'Choisis ta langue.',
  'ob.interfaceHint': 'Tu pourras changer ça plus tard dans les Réglages.',
  'ob.meaningTitle': 'Un petit coup de pouce,\ndans ta langue.',
  'ob.meaningSub': 'Choisis la langue que tu lis le plus facilement pour les significations.',
  'ob.meaningPicker': 'Langue des sous-titres',
  'ob.meaningHint': 'Active les significations quand tu as besoin d’un coup de main.',
  'ob.targetTitle': 'Qu’est-ce que tu veux\nparler ?',
  'ob.speaks': 'Mural parle {language}.',
  'ob.continue': 'Continuer',
  'ob.agree': 'Accepter et continuer',
  'ob.footnote0': 'On trouvera ton rythme par la conversation.',
  'ob.footnoteLast': 'Tu peux changer tout ça dans les Réglages.',
  'ob.backInterface': 'Retour à la langue de l’interface',
  'ob.backMeaning': 'Retour à la langue des sous-titres',

  'consent.summary':
    'Avec ta permission, Mural envoie l’audio et le texte sélectionné à OpenAI pour proposer des conversations et des significations. Les règles de conservation du fournisseur s’appliquent.',
  'consent.title': 'Avant de discuter.',
  'consent.body':
    'Ton historique d’apprentissage reste dans ce Mural. Mural n’enregistre pas l’audio brut. Tu peux continuer à parcourir tes mots et conversations sauvegardés sans accepter.',
  'consent.agree': 'Accepter et continuer',
  'consent.notNow': 'Pas maintenant',
  'consent.privacy': 'Politique de confidentialité',

  'talk.untitledTheme': 'Parlons {language}',
  'status.idle': 'Quand tu veux',
  'status.connecting': 'On s’installe…',
  'status.speaking': 'Mural parle',
  'status.listening': 'Je t’écoute',
  'status.waiting': 'Prends ton temps',
  'status.closing': 'Sauvegarde de notre conversation…',
  'status.ended': 'À la prochaine',
  'status.failed': 'On réessaie',
  'mic.on': 'Micro activé',
  'mic.muted': 'Micro coupé',
  'mic.connecting': 'Connexion du micro',
  'mic.off': 'Micro désactivé',
  'talk.translating': 'Recherche du sens…',
  'talk.retryMeaning': 'Réessayer la signification',
  'talk.checking': 'Je vérifie ça pour toi…',
  'talk.sources': 'Sources',
  'talk.meaning': 'Sens',
  'talk.showMeanings': 'Afficher les sous-titres de sens',
  'talk.hideMeanings': 'Masquer les sous-titres de sens',
  'talk.mute': 'Couper le micro',
  'talk.unmute': 'Réactiver le micro',
  'talk.start': 'Commencer une conversation',
  'talk.end': 'Terminer',
  'talk.endAria': 'Terminer la conversation',
  'talk.transcriptAria': 'Transcription de la conversation',
  'talk.transcript': 'Transcription',
  'talk.typeInstead': 'Écrire',
  'talk.help': 'Un coup de main',
  'talk.replyHint': 'Réponds dans la langue qui te vient.',
  'talk.new': 'Nouvelle conversation',

  'notice.simpler': 'Mural va simplifier un peu.',
  'notice.saved': 'Conversation sauvegardée. L’usage vocal final n’est pas confirmé.',
  'notice.updateFailed':
    'Une mise à jour de la conversation n’a pas pu être envoyée. Tu peux continuer à parler.',
  'notice.updateRejected':
    'Une mise à jour vocale a été rejetée. Si Mural cesse de répondre, termine cette conversation et recommence.',
  'notice.timeLimit': 'Tu as atteint la limite de temps de conversation.',
  'notice.idleEnd': 'Mural a terminé cette session inactive pour éviter d’utiliser du crédit.',
  'notice.lookupIncomplete': 'La recherche n’a pas abouti.',

  'typed.title': 'Dis-le à ta façon.',
  'typed.placeholder': 'Réponds en {language} ou dans une autre langue',
  'typed.send': 'Envoyer',
  'typed.sending': 'Envoi…',

  'lookup.title': 'Un peu de sens',
  'lookup.finding': 'Recherche du sens…',
  'word.title': 'Mot',
  'word.uses': '{count} utilisations autonomes · Vu pour la dernière fois le {date}',
  'word.remove': 'Retirer de mes mots',
  'word.new': 'Nouveau',
  'word.fragile': 'Fragile',
  'word.growing': 'En progrès',
  'word.steady': 'Solide',
  'word.expl0': 'Entendu ou utilisé avec de l’aide. Essaie de l’employer avec tes propres mots.',
  'word.expl1': 'Utilisé tout seul. On le fera revenir bientôt.',
  'word.expl2': 'Retrouvé des jours différents. Ça vaut encore la peine de le revoir.',
  'word.expl3': 'Retrouvé sur plusieurs jours et contextes. La force peut s’estomper avec le temps.',

  'topic.title': 'Le monde aujourd’hui',
  'topic.heading': 'Une conversation toute fraîche.',
  'topic.sub': 'De quoi aimerais-tu parler ?',
  'topic.find': 'Trouver un sujet',
  'topic.finding': 'Recherche de quelque chose d’intéressant…',
  'topic.talk': 'En parler',
  'topic.footnote':
    'La recherche utilise ton compte OpenAI hébergé. Les sources restent attachées au sujet.',

  'themes.eyebrow': 'Un point de départ',
  'themes.title': 'Qu’est-ce qui\nte trotte en tête ?',
  'themes.subtitle': 'La même compagnie. Un nouveau décor.',
  'themes.justTalk': 'Juste parler',
  'themes.search': 'Trouver une conversation',
  'themes.all': 'Tous',
  'themes.cat.everyday': 'Quotidien',
  'themes.cat.connection': 'Lien',
  'themes.cat.localLife': 'Vie locale',
  'themes.cat.interests': 'Centres d’intérêt',
  'themes.none': 'Aucune conversation ne correspond à « {search} ».',

  'words.eyebrow': 'Petit à petit · {language}',
  'words.title': 'Tes mots.',
  'words.subtitle': 'Des mots familiers, prêts pour une autre conversation.',
  'words.search': 'Trouver un mot',
  'words.emptySearchTitle': 'Pas encore de mot correspondant.',
  'words.emptyTitle': 'Ils vont grandir à partir d’ici.',
  'words.emptySearchBody': 'Essaie un autre mot en {language} ou un sens en {meaning}.',
  'words.emptyBody':
    'Au fil de nos discussions, les mots et phrases utiles trouvent leur place ici. Leur force grandit quand tu les rappelles au fil du temps.',
  'words.legend': '{n} · {label}',
  'words.legendNote':
    'Les barres estiment le rappel à l’oral, pas la maîtrise définitive. Utiliser un mot avec les significations visibles compte comme une pratique accompagnée.',
  'words.capabilities': 'Ta voix prend forme',
  'words.capNote':
    'Observé au fil des conversations. Ce sont des indications provisoires, pas des certifications de niveau.',
  'words.past': 'Conversations passées',

  'transcript.you': 'TOI',
  'transcript.mural': 'MURAL',
  'transcript.title': 'Notre conversation',
  'transcript.empty': 'Ta conversation apparaîtra ici.',
  'transcript.emptyIdle': 'Commence une conversation et tes mots apparaîtront ici.',
  'transcript.edit': 'Modifier',
  'transcript.deleted': 'Cette conversation a été supprimée.',
  'transcript.sources': 'Sources · {date}',
  'edit.title': 'Ce que tu as dit',
  'edit.body':
    'Corrige une phrase mal entendue. Les preuves d’apprentissage liées à l’ancienne formulation seront supprimées ; l’original reste dans l’historique de ta sauvegarde.',
  'edit.save': 'Enregistrer',
  'history.title': 'Conversations passées',
  'history.empty': 'Tes conversations en {language} apparaîtront ici.',
  'history.delete': 'Supprimer',
  'delete.title': 'Supprimer la conversation ?',
  'delete.body': 'Supprimer cette conversation et ses preuves d’apprentissage ?',
  'delete.confirm': 'Supprimer la conversation',

  'settings.title': 'Mets-toi à l’aise',
  'settings.pace': 'À ton rythme',
  'settings.paceFooter':
    'Chaque langue garde ses propres mots et sa progression. Mural trouve ton rythme par la conversation.',
  'settings.paceFooterRunning':
    'Termine cette conversation pour changer de langue. Chaque langue garde ses propres mots et sa progression.',
  'settings.learningLanguage': 'Langue d’apprentissage',
  'settings.interfaceLanguage': 'Langue de l’interface',
  'settings.meaningSubtitles': 'Sous-titres de sens',
  'settings.meaningLanguage': 'Langue des significations',
  'settings.corrections': 'Corrections',
  'settings.correctionsValue': 'En douceur, pendant la conversation',
  'settings.interests': 'Quelques choses que tu aimes',
  'settings.comfort': 'Reste confortable',
  'settings.comfortFooter':
    'L’estimation vocale utilise 0,05 $/min au 11 septembre 2026. La traduction, l’enseignement et la recherche coûtent en plus. Les requêtes interrompues peuvent être facturées sans relevé d’usage ici. Ton tableau de bord OpenAI fait foi. La limite de temps est locale, pas un plafond de facturation.',
  'settings.limit': 'Limite de conversation',
  'settings.minutes': '{m} minutes',
  'settings.voiceTime': 'Temps vocal enregistré',
  'settings.voiceTimeValue': '{m} min {s} s',
  'settings.voiceEstimate': 'Estimation vocale',
  'settings.searchCalls': 'Appels de recherche enregistrés',
  'settings.openaiUsage': 'Usage et facturation OpenAI',
  'settings.data': 'Tes mots t’appartiennent',
  'settings.dataFooter':
    'Les sauvegardes incluent les transcriptions et les preuves d’apprentissage, jamais les identifiants du compte. L’import ajoute des conversations avec de nouveaux identifiants. Les conversations existantes ne changent pas.',
  'settings.export': 'Exporter la sauvegarde d’apprentissage',
  'settings.import': 'Importer une sauvegarde d’apprentissage',
  'settings.imported': 'Ta sauvegarde a été importée.',
  'settings.importFailed': 'L’import a échoué.',
  'settings.deleteAll': 'Supprimer toutes les conversations et l’apprentissage',
  'settings.help': 'Aide et confidentialité',
  'settings.privacy': 'Politique de confidentialité',
  'settings.terms': 'Conditions d’utilisation',
  'settings.support': 'Contacter l’assistance',
  'settings.about': 'À propos de cette copie',
  'settings.aboutBody':
    'Mural web 0.1 · Voix : GPT-Live-1 · Professeur : GPT-5.6 Luna. L’audio et le texte sélectionné partent vers OpenAI pendant que tu pratiques ; l’audio brut n’est jamais sauvegardé.',
  'settings.openaiData': 'Contrôles de données OpenAI',
  'settings.signin': 'Connexion',
  'settings.signout': 'Se déconnecter de cet appareil',
  'settings.signoutTitle': 'Se déconnecter ?',
  'settings.signoutBody':
    'Il te faudra le mot de passe partagé pour te reconnecter. Ton historique d’apprentissage reste sur le serveur.',
  'settings.signoutConfirm': 'Se déconnecter',
  'settings.deleteAllTitle': 'Supprimer toutes les données d’apprentissage ?',
  'settings.deleteAllBody':
    'Cela supprime les conversations, le vocabulaire et la progression. Exporte d’abord une sauvegarde si tu veux les garder. Tes préférences restent.',
  'settings.deleteAllConfirm': 'Supprimer toutes les données d’apprentissage',

  'session.defaultTitle': 'Conversation en {language}',
  'pinyin.hide': 'Masquer le pinyin',
  'pinyin.show': 'Afficher le pinyin',
  'level.new': 'On apprend à te connaître',
  'level.pace': 'On trouve ton rythme',
  'error.saveProgress':
    'Mural n’a pas pu sauvegarder ta progression. Exporte une sauvegarde et réessaie.',
}

const DICTS: Record<InterfaceLanguage, Record<StringKey, string>> = { en, fr, 'pt-BR': ptBR }

export function translate(lang: InterfaceLanguage, key: StringKey, params?: Params): string {
  let s = DICTS[lang][key] ?? en[key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v))
  }
  return s
}

/// The interface language currently stored in preferences.
export function interfaceLanguageOf(preferences: { interfaceLanguage?: string }): InterfaceLanguage {
  return asInterfaceLanguage(preferences.interfaceLanguage)
}

/// Language display name in the interface language (falls back to the
/// module's English name).
export function languageName(m: LanguageModule, ui: InterfaceLanguage): string {
  try {
    return new Intl.DisplayNames([ui], { type: 'language' }).of(m.locale.split('-')[0]) ?? m.name
  } catch {
    return m.name
  }
}

/// "Norwegian · Bokmål" style picker label, localized to the interface.
export function localizedSettingsTitle(m: LanguageModule, ui: InterfaceLanguage): string {
  return `${languageName(m, ui)} · ${m.variety}`
}

/// BCP-47 locale for each entry in MEANING_LANGUAGES (display only — the
/// canonical English name is what gets stored in preferences).
const MEANING_LANGUAGE_LOCALES: Record<string, string> = {
  English: 'en',
  French: 'fr',
  German: 'de',
  Spanish: 'es',
  Norwegian: 'nb',
  Portuguese: 'pt',
  'Brazilian Portuguese': 'pt-BR',
  Italian: 'it',
  'Chinese (Simplified)': 'zh-Hans',
  Polish: 'pl',
  Arabic: 'ar',
  Ukrainian: 'uk',
}

/// Display name for a meaning language in the interface language.
export function meaningLanguageName(name: string, ui: InterfaceLanguage): string {
  const locale = MEANING_LANGUAGE_LOCALES[name]
  if (!locale) return name
  try {
    return new Intl.DisplayNames([ui], { type: 'language' }).of(locale) ?? name
  } catch {
    return name
  }
}

/// Meaning language name → available translation dictionary. Theme subtitles
/// are authored in English; pt/fr translations live in THEME_SUBTITLES and any
/// other meaning language falls back to English.
const MEANING_TO_DICT: Record<string, 'pt' | 'fr'> = {
  'Brazilian Portuguese': 'pt',
  Portuguese: 'pt',
  French: 'fr',
}

/// English theme subtitle → localized text, keyed by the stored English string
/// (language-module overrides reuse or add English subtitles, so translating by
/// key would miss them).
const THEME_SUBTITLES: Record<string, { pt?: string; fr?: string }> = {
  'A change of scene': { pt: 'Um ar diferente', fr: 'Changer d’air' },
  'A familiar face': { pt: 'Um rosto conhecido', fr: 'Un visage familier' },
  'A little of everything': { pt: 'Um pouco de tudo', fr: 'Un peu de tout' },
  'A place you remember': { pt: 'Um lugar que ficou em você', fr: 'Un lieu dont tu te souviens' },
  'A quieter kind of day': { pt: 'Um dia mais tranquilo', fr: 'Un jour plus paisible' },
  'A story that stayed': { pt: 'Uma história que ficou', fr: 'Une histoire qui reste' },
  'A ticket to somewhere': { pt: 'Uma passagem para algum lugar', fr: 'Un billet pour ailleurs' },
  'A very Norwegian chat': { pt: 'Um papo bem norueguês', fr: 'Une discussion très norvégienne' },
  'After the working day': { pt: 'Depois do expediente', fr: 'Après le boulot' },
  'An evening walk': { pt: 'Uma caminhada no fim de tarde', fr: 'Une balade en soirée' },
  'An invitation, maybe': { pt: 'Um convite, talvez', fr: 'Une invitation, peut-être' },
  'Around the office': { pt: 'Pelo escritório', fr: 'Au bureau' },
  'Find something good': { pt: 'Encontrar algo legal', fr: 'Trouver quelque chose de bien' },
  'Find the good tomatoes': { pt: 'Achar os tomates bons', fr: 'Trouver les bonnes tomates' },
  'Ideas, tools and tomorrow': { pt: 'Ideias, ferramentas e o amanhã', fr: 'Des idées, des outils et demain' },
  'Let the conversation linger': { pt: 'Deixar a conversa rolar', fr: 'Laisser la conversation durer' },
  'Let’s make something': { pt: 'Vamos fazer alguma coisa', fr: 'On cuisine quelque chose' },
  'Made with a little care': { pt: 'Feito com carinho', fr: 'Fait avec soin' },
  'Make yourself at home': { pt: 'Sinta-se em casa', fr: 'Mets-toi à l’aise' },
  'Out into the fresh air': { pt: 'Para respirar ar puro', fr: 'Prendre l’air' },
  'Plans worth talking about': { pt: 'Planos que valem uma conversa', fr: 'Des plans qui méritent d’en parler' },
  'Room for another view': { pt: 'Espaço para outro ponto de vista', fr: 'De la place pour un autre avis' },
  'Small customs, big stories': { pt: 'Pequenos costumes, grandes histórias', fr: 'Petites coutumes, grandes histoires' },
  'Something to talk about': { pt: 'Assunto para conversar', fr: 'De quoi discuter' },
  'Something warm, please': { pt: 'Algo quentinho, por favor', fr: 'Quelque chose de chaud' },
  'Something worth watching': { pt: 'Algo que vale assistir', fr: 'Quelque chose à regarder' },
  'Somewhere in the sunshine': { pt: 'Um lugar ensolarado', fr: 'Quelque part au soleil' },
  'Start somewhere small': { pt: 'Começar por algo simples', fr: 'Commencer petit' },
  'Stay a little longer': { pt: 'Fique mais um pouco', fr: 'Rester encore un peu' },
  'Stay for dessert': { pt: 'Fique para a sobremesa', fr: 'Rester pour le dessert' },
  'Tell me about yours': { pt: 'Me conta do seu', fr: 'Raconte-moi le tien' },
  'What are you listening to?': { pt: 'O que você está ouvindo?', fr: 'Tu écoutes quoi ?' },
  'Whatever the weather': { pt: 'Chova ou faça sol', fr: 'Quel que soit le temps' },
}

/// Theme subtitle in the learner's meaning language (English fallback).
export function themeSubtitle(subtitle: string, meaningLanguage: string): string {
  const lang = MEANING_TO_DICT[meaningLanguage]
  if (!lang) return subtitle
  return THEME_SUBTITLES[subtitle]?.[lang] ?? subtitle
}
