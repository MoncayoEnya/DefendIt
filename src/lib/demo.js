// A sample study pack so people can try the app before uploading their own thesis.
export const DEMO_PACK = {
  title: 'Mobile Learning Apps and the Academic Performance of Grade 11 Students',
  fileName: 'demo-thesis.pdf',
  source: 'ai',
  overview:
    'This study looked at whether using mobile learning apps affects the grades of Grade 11 students in a public high school. It used a descriptive-correlational design with 150 students chosen by stratified random sampling. Students who used learning apps more often had moderately higher grades (r = 0.52), but the study cannot prove the apps caused the improvement.',
  elevatorPitch:
    'Good morning, panel. Many students own smartphones, but we did not know if the learning apps on them actually help grades. So we surveyed 150 Grade 11 students and compared how often they used learning apps with their general average. We found a moderate positive relationship, which means frequent app users tend to perform better. Our results can help teachers and the school decide how to include mobile learning in their lessons.',
  sections: [
    { title: 'Introduction', summary: 'Smartphone use among students is high, but its effect on learning is unclear in the local setting.', keyPoints: ['92% of respondents own a smartphone', 'Few local studies on Grade 11 learners', 'Aims to guide school technology policy'] },
    { title: 'Statement of the Problem', summary: 'The study asks how often students use learning apps, what their grades are, and whether the two are related.', keyPoints: ['Level of app usage', 'Level of academic performance', 'Significant relationship between the two'] },
    { title: 'Review of Related Literature', summary: 'Past studies show mixed results: some found apps improve engagement, others found distraction.', keyPoints: ['Based on Mobile Learning Theory', 'Foreign studies mostly college-level', 'Gap: senior high in public schools'] },
    { title: 'Methodology', summary: 'Descriptive-correlational design, 150 students by stratified random sampling, a validated survey, and Pearson r for analysis.', keyPoints: ['Slovin\'s formula for sample size', 'Instrument validated by 3 experts', 'Cronbach\'s alpha = 0.87 (good reliability)'] },
    { title: 'Results & Discussion', summary: 'App usage was "often" (mean 3.6/5). Grades averaged 87.4. Pearson r = 0.52, p < 0.05, showing a moderate positive relationship.', keyPoints: ['Moderate positive correlation', 'Significant at 0.05 level', 'Correlation is not causation'] },
    { title: 'Conclusion & Recommendations', summary: 'Frequent learning-app use is linked to better grades, so schools may guide students to use quality apps.', keyPoints: ['Teachers can assign app-based activities', 'Future study: experimental design', 'Include private schools next time'] },
  ],
  terms: [
    { term: 'Descriptive-Correlational Design', definition: 'A design that describes variables and measures how strongly they are related, without manipulating them.' },
    { term: 'Stratified Random Sampling', definition: 'Dividing the population into groups (strands) and randomly selecting from each so every group is fairly represented.' },
    { term: "Slovin's Formula", definition: 'A formula used to compute the sample size from the population size and margin of error: n = N / (1 + Ne²).' },
    { term: 'Pearson r', definition: 'A statistic from -1 to +1 that measures the strength and direction of a linear relationship between two variables.' },
    { term: "Cronbach's Alpha", definition: 'A measure of internal consistency (reliability) of a questionnaire; 0.87 means good reliability.' },
    { term: 'P-value', definition: 'The probability the result happened by chance; below 0.05 means the relationship is statistically significant.' },
    { term: 'Mobile Learning Theory', definition: 'The theory that learning can happen anytime and anywhere through portable devices.' },
    { term: 'Academic Performance', definition: "In this study, the student's general weighted average for the first semester." },
    { term: 'Null Hypothesis', definition: 'The statement that there is no significant relationship between app usage and academic performance.' },
    { term: 'Validity', definition: 'How well the instrument measures what it is supposed to measure; checked by three expert validators.' },
  ],
  questions: [
    { question: 'Why did you choose a correlational design instead of an experimental one?', type: 'Methodology', idealPoints: ['Goal was to find a relationship, not cause', 'Ethical/practical limits on controlling app use', 'Suggest experimental design for future study'] },
    { question: 'Your r is 0.52. Can you say that apps cause higher grades?', type: 'Results', idealPoints: ['No, correlation is not causation', 'Other factors may affect grades', 'Moderate positive relationship only'] },
    { question: 'How did you get 150 respondents and why is it enough?', type: 'Sampling', idealPoints: ["Slovin's formula with 5% margin of error", 'Population size', 'Stratified by strand for representation'] },
    { question: 'How do you know your questionnaire is reliable?', type: 'Instrument', idealPoints: ['Pilot test', "Cronbach's alpha = 0.87", 'Validated by three experts'] },
    { question: 'What is the gap your study filled?', type: 'Literature', idealPoints: ['Most studies were college-level / foreign', 'Focused on Grade 11 public school', 'Local context'] },
    { question: 'What are the limitations of your study?', type: 'Limitations', idealPoints: ['One school only', 'Self-reported app usage', 'One semester of grades'] },
    { question: 'Who benefits from your study?', type: 'Significance', idealPoints: ['Students', 'Teachers', 'School administrators', 'Future researchers'] },
    { question: 'Did you consider students who use apps for games, not learning?', type: 'Critical thinking', idealPoints: ['Questionnaire asked specifically about learning apps', 'Admit possible bias', 'Future study can track actual usage'] },
  ],
  weakSpots: [
    'Causation vs correlation – panels love to test this.',
    'Self-reported usage may be inaccurate.',
    'Only one school, so results may not generalize.',
  ],
}
