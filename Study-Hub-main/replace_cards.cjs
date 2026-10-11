const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AICompanion.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const cardsReplacement = `
                    <div>
                      {/* Interactive Flip Card Box or Edit Mode */}
                      {editingCardIndex === previewCardIndex ? (
                        <div className="bg-white border-2 border-indigo-200 rounded-2xl p-4 min-h-[140px] flex flex-col gap-3 shadow-xs">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">السؤال (الجهة الأمامية)</label>
                            <textarea
                              className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              rows={2}
                              value={editCardFront}
                              onChange={(e) => setEditCardFront(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">الإجابة (الجهة الخلفية)</label>
                            <textarea
                              className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                              rows={3}
                              value={editCardBack}
                              onChange={(e) => setEditCardBack(e.target.value)}
                            />
                          </div>
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => setEditingCardIndex(null)}
                              className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                              إلغاء
                            </button>
                            <button
                              onClick={() => handleSaveEditCard(previewCardIndex)}
                              className="px-3 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" /> حفظ التعديل
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative group">
                          <div 
                            onClick={() => setPreviewCardFlipped(!previewCardFlipped)}
                            className="bg-white border-2 border-indigo-100 rounded-2xl p-6 min-h-[140px] flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 transition shadow-xs relative"
                          >
                            <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md">
                              {previewCardFlipped ? "الجهة الخلفية (الإجابة/الشرح)" : "الجهة الأمامية (المفهوم/السؤال)"}
                            </span>
                            
                            <p className="text-sm font-bold text-slate-800 leading-relaxed max-w-md">
                              {previewCardFlipped 
                                ? previewMaterial.flashcards[previewCardIndex]?.back 
                                : previewMaterial.flashcards[previewCardIndex]?.front}
                            </p>
                            <div className="mt-4 flex items-center gap-1 text-[11px] text-indigo-600 font-semibold opacity-80 group-hover:opacity-100">
                              <RotateCw className="w-3.5 h-3.5" />
                              <span>اضغط لاقتعطاف/اقلاب البطاقة والمعاينة</span>
                            </div>
                          </div>
                          {/* Floating Edit/Delete Actions */}
                          <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditCardFront(previewMaterial.flashcards![previewCardIndex].front);
                                setEditCardBack(previewMaterial.flashcards![previewCardIndex].back);
                                setEditingCardIndex(previewCardIndex);
                              }}
                              className="p-1.5 bg-white/80 hover:bg-white text-slate-600 hover:text-indigo-600 rounded-md shadow-sm border border-slate-200"
                              title="تعديل البطاقة"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCard(previewCardIndex);
                              }}
                              className="p-1.5 bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 rounded-md shadow-sm border border-slate-200"
                              title="حذف البطاقة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Pagination Controls */}
`;

const startIndex = content.indexOf('                    <div>\n                      {/* Interactive Flip Card Box */}');
const endIndex = content.indexOf('                      {/* Pagination Controls */}');

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + cardsReplacement + content.substring(endIndex + 49);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Flashcards UI updated.");
} else {
  console.log("Could not find flashcards UI markers.");
}
