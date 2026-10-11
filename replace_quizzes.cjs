const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AICompanion.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const quizzesReplacement = `
                    previewMaterial.quizzes.map((quiz, qIdx) => (
                      <div key={qIdx} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2 text-right relative group">
                        {editingQuizIndex === qIdx ? (
                          <div className="flex flex-col gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">السؤال</label>
                              <input
                                type="text"
                                className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={editQuizQuestion}
                                onChange={(e) => setEditQuizQuestion(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-600 mb-1">الخيارات (حدد الإجابة الصحيحة)</label>
                              {editQuizOptions.map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-2">
                                  <input 
                                    type="radio" 
                                    name={\`correct-answer-\${qIdx}\`}
                                    checked={editQuizAnswerIndex === oIdx}
                                    onChange={() => setEditQuizAnswerIndex(oIdx)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                                  />
                                  <input
                                    type="text"
                                    className={\`flex-1 text-xs p-2 border rounded-md outline-none \${editQuizAnswerIndex === oIdx ? 'bg-emerald-50 border-emerald-300' : 'border-slate-200 focus:border-indigo-300'}\`}
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...editQuizOptions];
                                      newOpts[oIdx] = e.target.value;
                                      setEditQuizOptions(newOpts);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                onClick={() => setEditingQuizIndex(null)}
                                className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                              >
                                إلغاء
                              </button>
                              <button
                                onClick={() => handleSaveEditQuiz(qIdx)}
                                className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
                              >
                                <Save className="w-3.5 h-3.5" /> حفظ التعديل
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between items-start gap-4">
                              <p className="text-xs font-extrabold text-slate-800">
                                {qIdx + 1}. {quiz.question}
                              </p>
                              {/* Edit/Delete Actions */}
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditQuizQuestion(quiz.question);
                                    setEditQuizOptions([...quiz.options]);
                                    setEditQuizAnswerIndex(quiz.answerIndex);
                                    setEditingQuizIndex(qIdx);
                                  }}
                                  className="p-1 text-slate-400 hover:text-indigo-600 transition"
                                  title="تعديل السؤال"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteQuiz(qIdx)}
                                  className="p-1 text-slate-400 hover:text-rose-600 transition"
                                  title="حذف السؤال"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {quiz.options.map((opt, oIdx) => (
                                <div 
                                  key={oIdx}
                                  className={\`p-2 rounded-lg text-[11px] border font-semibold \${
                                    oIdx === quiz.answerIndex
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                      : "bg-slate-50 border-slate-200 text-slate-600"
                                  }\`}
                                >
                                  <span>{opt}</span>
                                  {oIdx === quiz.answerIndex && (
                                    <span className="mr-1 text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-xs">الإجابة الصحيحة</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    ))
`;

const startIndex = content.indexOf('                    previewMaterial.quizzes.map((quiz, qIdx) => (');
const endIndex = content.indexOf('                        </div>\n                      </div>\n                    ))');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + quizzesReplacement + content.substring(endIndex + 73);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Quizzes UI updated.");
} else {
  console.log("Could not find quizzes UI markers.");
}
