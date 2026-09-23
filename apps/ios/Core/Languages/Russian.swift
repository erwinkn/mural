import Foundation

extension LanguageModule {
    public static let russian = LanguageModule(
        id: "ru", name: "Russian", nativeName: "Русский", variety: "Standard", locale: "ru-RU",
        greeting: "Привет!", greetingWord: "привет",
        speechGuidance: "Use clear, natural Standard Russian with consistent literary pronunciation. Use ты in friendly conversation and вы with strangers, staff or when the learner prefers it. Treat word stress, vowel reduction, soft and hard consonants, and the difference between ы and и as meaningful when they affect understanding. Accept valid regional pronunciation and vocabulary from anywhere Russian is spoken. Do not treat a regional difference or a non-native accent alone as an error. Correct stress or pronunciation only when the audio supports it, not a transcript alone. When correcting a case ending or verb aspect, recast the phrase and name the case or aspect in one short clause instead of giving a grammar lecture.",
        writingGuidance: "Use standard modern Russian spelling in Cyrillic and Russian punctuation, including «» quotation marks and dashes. Always write ё where it belongs in your own text, but accept е for ё from the learner unless it changes the meaning, as in все and всё. Do not add stress marks to ordinary replies. Reply in Cyrillic even when the learner types Latin transliteration. Match the register to the situation.",
        lemmaGuidance: "Give Cyrillic dictionary forms without transliteration or stress marks: nouns in the nominative singular, or the plural for plural-only nouns such as деньги; adjectives in the masculine nominative singular; verbs in the infinitive. Keep aspect partners such as читать and прочитать as separate entries, and keep reflexive verbs with -ся, for example заниматься. Write ё in the lemma where the dictionary form has it, for example ещё even when the learner wrote еще, but keep different words such as все and всё separate. Keep the form and quote exactly as observed, including the learner's case ending, е for ё and transliteration. When explaining a word, you may mark its stress once with an acute accent, for example молоко́.",
        teachingFocus: [
            "Greetings, introductions and useful everyday chunks such as меня зовут, я хочу and можно, with stress on key words.",
            "Everyday questions, noun gender, present tense, nominative and accusative, в and на with the prepositional for places, and ты and вы.",
            "Connected stories, past tense with gender agreement, verb aspect in the past, basic verbs of motion, and the genitive after нет, numbers and quantities.",
            "Reasons and opinions, dative and instrumental uses, aspect in the future and in requests, polite бы, and clauses with что, потому что and который.",
            "Nuance, prefixed verbs of motion, finer aspect choices, participles and verbal adverbs in context, word order for emphasis, idiomatic phrasing and register.",
            "Flexible advanced discussion with precise, natural Russian, accurate case and aspect, and appropriate tone."
        ],
        topicPlaceholder: "Food, books, travel, everyday life…",
        lookupUnavailableReply: "Сейчас я не могу это проверить. Если хочешь, можем поговорить об этом в общих чертах.",
        themeOverrides: [
            "coffee": .init("coffee", "Чай или кофе?", "Something warm, please", "cup.and.saucer", "Everyday", "Meet at a neighbourhood café in a Russian-speaking city. Order tea or coffee, perhaps with something sweet, and chat about the learner's day. Use вы with staff and ты with a friend.", 0),
            "groceries": .init("groceries", "На рынке", "A little of everything", "basket", "Everyday", "Shop at a market in a Russian-speaking city. Practise quantities, prices and polite requests, including the genitive after numbers, and accept regional names for foods.", 2),
            "travel": .init("travel", "В дорогу", "A ticket to somewhere", "tram", "Everyday", "Plan a long-distance train trip in Russia. Discuss routes, carriages and tickets without inventing current schedules, prices or travel rules.", 1),
            "cabin": .init("cabin", "На даче", "A quieter kind of day", "tree", "Local life", "Spend an imagined weekend at a dacha outside the city. Talk about the garden, cooking, the banya and slow summer days.", 2),
            "traditions": .init("traditions", "Разговор на кухне", "Stay a little longer", "fork.knife", "Local life", "Talk at an imagined kitchen table over tea about routines, holidays and everyday customs. Compare the learner's experiences without treating Russian-speaking cultures as uniform.", 2)
        ]
    )
}
