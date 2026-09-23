package chat.mural.core

import org.junit.Assert.*
import org.junit.Test

class RussianLanguageTest {
    private fun record(text: String, words: List<Triple<String, String, String>>, language: String = "ru", startedAt: Double = 1_000.0): SessionRecord {
        val session = SessionRecord(languageID = language, startedAt = startedAt)
        session.append(Fragment(id = "f-$startedAt", speaker = Speaker.user, text = text, startMS = 0, endMS = 3000))
        val passage = session.passages.single()
        session.assessments += Assessment(passage.id, passage.revisionKey, Outcome.success, 2, "goal", "capability",
            words.map { (lemma, form, meaning) -> WordProposal(lemma, meaning, form, EvidenceKind.independent, 0.9, listOf("f-$startedAt"), text, language) })
        return session
    }

    @Test fun moduleIsRegisteredWithStandardRussianContent() {
        val russian = LanguageRegistry.get("ru")!!
        assertEquals("ru-RU", russian.locale)
        assertEquals("Привет!", russian.greeting)
        assertEquals("Russian · Standard", russian.settingsTitle)
        assertEquals(6, russian.teachingFocus.size)
        assertEquals(Themes.shared.map { it.id }, russian.themes.map { it.id })
        assertEquals("На даче", russian.themes.single { it.id == "cabin" }.title)
        assertTrue(russian.lemmaGuidance.contains("keep different words such as все and всё separate"))
    }

    @Test fun cyrillicWordLinksMatchIOS() {
        val text = "«Привет!» — сказал он.\nЧто-нибудь по-русски? Ещё молоко́…"
        val segments = CaptionWords.segments(text, "ru", null)
        assertEquals(text, segments.joinToString("") { it.text })
        assertEquals(listOf("Привет", "сказал", "он", "Что-нибудь", "по-русски", "Ещё", "молоко́"), segments.mapNotNull { it.lookup })
    }

    @Test fun yoAndYeStayDistinctWhileTheLearnersSpellingIsKept() {
        val both = record("Я всё ещё учусь, а все уже дома.", listOf(Triple("всё", "всё", "everything"), Triple("все", "все", "everyone")))
        val words = LearningEngine.validate(both.assessments.single(), both)!!.words
        assertEquals(2, words.size); assertNotEquals(words[0].key, words[1].key)

        val mismatch = record("Я еще учусь.", listOf(Triple("ещё", "ещё", "still")))
        assertTrue(LearningEngine.validate(mismatch.assessments.single(), mismatch)!!.words.isEmpty())
        val stressed = record("Я люблю молоко.", listOf(Triple("молоко́", "молоко́", "milk")))
        assertTrue(LearningEngine.validate(stressed.assessments.single(), stressed)!!.words.isEmpty())

        val plain = record("Я еще учусь.", listOf(Triple("ещё", "еще", "still")))
        val written = record("Я ещё учусь.", listOf(Triple("ещё", "ещё", "still")), startedAt = 2_000.0)
        val state = LearningEngine.project(listOf(plain, written), "ru", now = 3_000.0)
        assertEquals(listOf("ещё"), state.words.map { it.lemma })
        assertEquals(2, state.words.single().independentCount)
        assertEquals("ru|всё|everything", WordProposal("все\u0308", "everything", "всё", EvidenceKind.independent, 0.9, emptyList(), "всё", "ru").key)
    }

    @Test fun progressAndBackupsStayIsolated() {
        val archive = Archive(sessions = mutableListOf(
            record("Я всё ещё учусь, а все уже дома.", listOf(Triple("всё", "всё", "everything"), Triple("все", "все", "everyone"))),
            record("Hei, jeg liker kaffe.", listOf(Triple("kaffe", "kaffe", "coffee")), "nb", 2_000.0)),
            preferences = Preferences(learningLanguageID = "ru", hiddenWords = listOf("ru|все|everyone")))
        val restored = ArchiveCodec.decode(ArchiveCodec.encode(archive))
        assertEquals("ru", restored.preferences.learningLanguageID)
        assertEquals("Я всё ещё учусь, а все уже дома.", restored.sessions[0].passages.single().text)
        assertEquals(listOf("всё"), LearningEngine.project(restored.sessions, "ru", restored.preferences.hiddenWords).words.map { it.lemma })
        assertEquals(listOf("kaffe"), LearningEngine.project(restored.sessions, "nb").words.map { it.lemma })
        for (other in LanguageRegistry.all.filter { it.id != "ru" })
            assertTrue(other.id, LearningEngine.project(restored.sessions, other.id).words.none { it.lemma == "всё" })
    }
}
