const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'AICompanion.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const stateInjection = `
  // Editing States
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [editCardFront, setEditCardFront] = useState("");
  const [editCardBack, setEditCardBack] = useState("");

  const [editingQuizIndex, setEditingQuizIndex] = useState<number | null>(null);
  const [editQuizQuestion, setEditQuizQuestion] = useState("");
  const [editQuizOptions, setEditQuizOptions] = useState<string[]>(["", "", "", ""]);
  const [editQuizAnswerIndex, setEditQuizAnswerIndex] = useState<number>(0);

  // Edit / Delete Handlers
  const handleDeleteCard = (index: number) => {
    if (!previewMaterial || !previewMaterial.flashcards) return;
    const newCards = [...previewMaterial.flashcards];
    newCards.splice(index, 1);
    setPreviewMaterial({ ...previewMaterial, flashcards: newCards });
    if (previewCardIndex >= newCards.length && newCards.length > 0) {
      setPreviewCardIndex(newCards.length - 1);
    }
  };

  const handleSaveEditCard = (index: number) => {
    if (!previewMaterial || !previewMaterial.flashcards) return;
    const newCards = [...previewMaterial.flashcards];
    newCards[index] = { ...newCards[index], front: editCardFront, back: editCardBack };
    setPreviewMaterial({ ...previewMaterial, flashcards: newCards });
    setEditingCardIndex(null);
  };

  const handleDeleteQuiz = (index: number) => {
    if (!previewMaterial || !previewMaterial.quizzes) return;
    const newQuizzes = [...previewMaterial.quizzes];
    newQuizzes.splice(index, 1);
    setPreviewMaterial({ ...previewMaterial, quizzes: newQuizzes });
  };

  const handleSaveEditQuiz = (index: number) => {
    if (!previewMaterial || !previewMaterial.quizzes) return;
    const newQuizzes = [...previewMaterial.quizzes];
    newQuizzes[index] = { 
      ...newQuizzes[index], 
      question: editQuizQuestion, 
      options: editQuizOptions, 
      answerIndex: editQuizAnswerIndex 
    };
    setPreviewMaterial({ ...previewMaterial, quizzes: newQuizzes });
    setEditingQuizIndex(null);
  };
`;

content = content.replace(
  '  const messagesEndRef = useRef<HTMLDivElement>(null);',
  stateInjection + '\n  const messagesEndRef = useRef<HTMLDivElement>(null);'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("States added.");
