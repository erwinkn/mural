import XCTest
@testable import MuralCore

final class RussianLanguageTests: XCTestCase {
    private func session(_ text: String, words: [(lemma: String, form: String, meaning: String)], language: String = "ru", day: Int = 0) -> SessionRecord {
        let date = Date(timeIntervalSince1970: 1_780_000_000 + Double(day) * 86400)
        var result = SessionRecord(languageID: language, themeID: "cabin")
        result.startedAt = date
        result.append(Fragment(speaker: .user, text: text, startMS: 0, endMS: 3000, receivedAt: date))
        let passage = result.passages[0]
        result.assessments = [Assessment(passageID: passage.id, revisionKey: passage.revisionKey, outcome: .success,
            suggestedLevel: 2, nextGoal: "Расскажи о даче.", capability: "Describes a weekend", words: words.map {
                WordProposal(lemma: $0.lemma, meaning: $0.meaning, form: $0.form, kind: .independent, confidence: 0.9,
                             sourceIDs: passage.fragments.map(\.id), quote: text, language: language)
            }, createdAt: date)]
        return result
    }

    func testModuleUsesStandardRussianContentAndSharedThemeIDs() throws {
        let russian = try XCTUnwrap(LanguageRegistry.module(for: "ru"))
        XCTAssertEqual(russian.locale, "ru-RU")
        XCTAssertEqual(russian.nativeName, "Русский")
        XCTAssertEqual(russian.settingsTitle, "Russian · Standard")
        XCTAssertEqual(russian.teachingFocus.count, 6)
        XCTAssertEqual(russian.themes.map(\.id), ConversationTheme.shared.map(\.id))
        XCTAssertTrue(Set(russian.themeOverrides.keys).isSubset(of: ConversationTheme.shared.map(\.id)))
        for (id, theme) in russian.themeOverrides {
            XCTAssertEqual(theme.id, id)
            XCTAssertTrue(theme.title.unicodeScalars.contains { (0x0400...0x04FF).contains($0.value) }, id)
        }
        XCTAssertEqual(russian.themes.first { $0.id == "cabin" }?.title, "На даче")
        XCTAssertTrue(russian.lookupUnavailableReply.hasPrefix("Сейчас"))
    }

    func testGuidanceCoversCaseAspectStressAndYo() throws {
        let russian = try XCTUnwrap(LanguageRegistry.module(for: "ru"))
        let voice = TeachingPolicy.voice(language: russian, learner: LearningEngine.project([], languageID: "ru"), theme: nil, interests: "", meaningLanguage: "English")
        let assessment = TeachingPolicy.assessment(language: russian)
        for fragment in ["case ending or verb aspect", "word stress", "ы and и", "ты", "вы"] { XCTAssertTrue(voice.contains(fragment), fragment) }
        for fragment in ["ё where it belongs", "все and всё", "Do not add stress marks", "Cyrillic"] { XCTAssertTrue(voice.contains(fragment), fragment) }
        for fragment in ["aspect partners", "читать and прочитать", "keep different words such as все and всё separate", "exactly as observed"] {
            XCTAssertTrue(assessment.contains(fragment), fragment)
        }
        XCTAssertTrue(russian.teachingFocus.contains { $0.contains("verb aspect") })
        XCTAssertTrue(russian.teachingFocus.contains { $0.contains("genitive") })
    }

    func testCyrillicWordLinksKeepPunctuationHyphensStressAndLineBreaks() {
        let text = "«Привет!» — сказал он.\nЧто-нибудь по-русски? Ещё молоко́…"
        let segments = CaptionWords.segments(text, languageID: "ru")
        XCTAssertEqual(segments.map(\.text).joined(), text)
        XCTAssertEqual(segments.compactMap(\.lookup), ["Привет", "сказал", "он", "Что-нибудь", "по-русски", "Ещё", "молоко́"])
    }

    func testYoAndYeStayDistinctWhileTheLearnersSpellingIsKept() throws {
        let record = session("Я всё ещё учусь, а все уже дома.", words: [("всё", "всё", "everything"), ("все", "все", "everyone")])
        let validated = try XCTUnwrap(LearningEngine.validate(record.assessments[0], session: record))
        XCTAssertEqual(validated.words.count, 2)
        XCTAssertNotEqual(validated.words[0].key, validated.words[1].key)

        // A form written with ё cannot be matched against a learner who wrote е, or the reverse.
        let mismatch = session("Я еще учусь.", words: [("ещё", "ещё", "still")])
        XCTAssertTrue(LearningEngine.validate(mismatch.assessments[0], session: mismatch)!.words.isEmpty)
        // The lemma keeps ё, the form keeps the learner's е, and both spellings share one vocabulary key.
        let plain = session("Я еще учусь.", words: [("ещё", "еще", "still")])
        let written = session("Я ещё учусь.", words: [("ещё", "ещё", "still")], day: 2)
        XCTAssertEqual(LearningEngine.validate(plain.assessments[0], session: plain)?.words.first?.form, "еще")
        let state = LearningEngine.project([plain, written], languageID: "ru", now: written.startedAt)
        XCTAssertEqual(state.words.map(\.lemma), ["ещё"])
        XCTAssertEqual(state.words.first?.independentCount, 2)

        let decomposed = WordProposal(lemma: "все\u{0308}", meaning: "everything", form: "всё", kind: .independent, confidence: 0.9, sourceIDs: [], quote: "всё", language: "ru")
        XCTAssertEqual(decomposed.key, "ru|всё|everything")
        XCTAssertNotEqual(decomposed.key, "ru|все|everything")
    }

    func testStressMarksInEvidenceMustMatchTheTranscript() {
        let record = session("Я люблю молоко.", words: [("молоко́", "молоко́", "milk")])
        XCTAssertTrue(LearningEngine.validate(record.assessments[0], session: record)!.words.isEmpty)
    }

    func testRussianProgressAndBackupsStayIsolatedFromOtherCyrillicText() throws {
        var archive = Archive()
        archive.preferences.learningLanguageID = "ru"
        archive.preferences.hiddenWords = ["ru|все|everyone"]
        archive.sessions = [session("Я всё ещё учусь, а все уже дома.", words: [("всё", "всё", "everything"), ("все", "все", "everyone")]),
                            session("Hei, jeg liker kaffe.", words: [("kaffe", "kaffe", "coffee")], language: "nb", day: 1)]
        let restored = try Archive.decode(archive.encoded())
        XCTAssertEqual(restored.preferences.learningLanguageID, "ru")
        XCTAssertEqual(restored.preferences.hiddenWords, ["ru|все|everyone"])
        XCTAssertEqual(restored.sessions[0].passages[0].text, "Я всё ещё учусь, а все уже дома.")
        let russian = LearningEngine.project(restored.sessions, languageID: "ru", hiddenWords: restored.preferences.hiddenWords)
        XCTAssertEqual(russian.words.map(\.lemma), ["всё"])
        XCTAssertEqual(LearningEngine.project(restored.sessions, languageID: "nb").words.map(\.lemma), ["kaffe"])
        for other in LanguageRegistry.all where other.id != "ru" {
            XCTAssertFalse(LearningEngine.project(restored.sessions, languageID: other.id).words.contains { $0.lemma == "всё" }, other.id)
        }
    }

    func testRelatedCyrillicLanguagesStillTriggerARedirect() {
        for detected in ["ru", "ru-RU", "ru_RU", "RU"] {
            XCTAssertFalse(TeachingPolicy.shouldRedirectSpeech(language: .russian, detectedLanguageID: detected, confidence: 0.99), detected)
        }
        for detected in ["uk", "be", "bg", "sr", "kk"] {
            XCTAssertTrue(TeachingPolicy.shouldRedirectSpeech(language: .russian, detectedLanguageID: detected, confidence: 0.99), detected)
        }
    }
}
