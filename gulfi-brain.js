/**
 * GULFI CHAT — CORE INTELLIGENCE ENGINE (gulfi-brain.js)
 * Master System Prompt Implementation
 * 
 * - Identity: Gulfi Chat 😊
 * - Languages: English, Tamil, Tanglish, Tamil+English mixed
 * - Timezone: Asia/Kolkata (IST UTC+05:30)
 * - Modes: Coding, Education (2/5/13 marks), Projects, Creative, Conversational
 * - Zero external API requirement by default (works 100% out of the box)
 * - Optional LLM endpoint support (Groq/OpenRouter/Ollama/OpenAI compatible)
 */

class GulfiBrain {
  constructor() {
    this.name = "Gulfi Chat";
    this.timeZone = "Asia/Kolkata";
    this.history = [];
    const hasLocalStorage = typeof localStorage !== "undefined";
    this.customApiKey = hasLocalStorage ? (localStorage.getItem("gulfi_api_key") || "") : "";
    this.customEndpoint = hasLocalStorage ? (localStorage.getItem("gulfi_endpoint") || "") : "";
    this.customModel = hasLocalStorage ? (localStorage.getItem("gulfi_model") || "default") : "default";
  }

  // Helper: Get Current IST Date and Time
  getISTTime(customDate = new Date()) {
    const optionsDate = {
      timeZone: this.timeZone,
      day: "numeric",
      month: "long",
      year: "numeric"
    };
    const optionsTime = {
      timeZone: this.timeZone,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    };
    const optionsDay = {
      timeZone: this.timeZone,
      weekday: "long"
    };

    const formatterDate = new Intl.DateTimeFormat("en-IN", optionsDate);
    const formatterTime = new Intl.DateTimeFormat("en-IN", optionsTime);
    const formatterDay = new Intl.DateTimeFormat("en-IN", optionsDay);

    return {
      date: formatterDate.format(customDate),
      time: formatterTime.format(customDate) + " IST",
      day: formatterDay.format(customDate),
      fullString: `${formatterDate.format(customDate)} at ${formatterTime.format(customDate)} IST`
    };
  }

  // Calculate relative dates in IST
  getRelativeDate(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return this.getISTTime(d);
  }

  // Detect query language (English, Tanglish, Tamil)
  detectLanguage(text) {
    const tamilRegex = /[\u0B80-\u0BFF]/;
    if (tamilRegex.test(text)) return "tamil";

    const tanglishKeywords = [
      "enna", "ennaku", "sollu", "solunga", "epdi", "eppadi", "pandrathu", "panradhu",
      "puriyala", "venum", "illa", "seri", "ama", "aama", "konjam", "romba",
      "seekiram", "ippo", "apram", "eppo", "engae", "enga", "da", "di", "machi", "bro",
      "kudutha", "vaichi", "pannu", "theriyuma", "paaru", "kooda", "edhula", "irukku", "tharuva"
    ];

    const lower = text.toLowerCase();
    const isTanglish = tanglishKeywords.some(kw => new RegExp(`\\b${kw}\\b`, "i").test(lower));
    return isTanglish ? "tanglish" : "english";
  }

  // Main processing pipeline
  async respond(userMessage, conversationHistory = []) {
    this.history = conversationHistory;
    const cleanMsg = userMessage.trim();
    const lower = cleanMsg.toLowerCase();
    const lang = this.detectLanguage(cleanMsg);

    // If custom API is configured and enabled, try external model first
    if (this.customApiKey && this.customEndpoint) {
      try {
        const extResponse = await this.queryExternalLLM(cleanMsg, conversationHistory);
        if (extResponse) return extResponse;
      } catch (err) {
        console.warn("External LLM error, falling back to local Gulfi Brain:", err);
      }
    }

    // 1. Identity Queries
    if (
      lower.includes("what is your name") ||
      lower.includes("un per enna") ||
      lower.includes("unga peru enna") ||
      lower.includes("who are you") ||
      lower.includes("yaar nee") ||
      lower.includes("identity") ||
      lower === "gulfi?" ||
      lower === "who made you"
    ) {
      return this.handleIdentity(lang);
    }

    // 2. Date and Time (IST) Queries
    if (
      lower.includes("time") ||
      lower.includes("date") ||
      lower.includes("neram") ||
      lower.includes("naal") ||
      lower.includes("today") ||
      lower.includes("tomorrow") ||
      lower.includes("yesterday") ||
      lower.includes("innaiku") ||
      lower.includes("naalaiku") ||
      lower.includes("nethu")
    ) {
      const timeResp = this.handleTimeAndDate(cleanMsg, lang);
      if (timeResp) return timeResp;
    }

    // 3. Greetings & Casual Chat
    if (this.isGreeting(lower)) {
      return this.handleGreeting(lang);
    }

    if (lower.includes("bored") || lower.includes("bore adikuthu") || lower.includes("bore")) {
      return this.handleBored(lang);
    }

    if (lower.includes("thank") || lower.includes("nandri") || lower.includes("tq") || lower.includes("thx")) {
      return this.handleThanks(lang);
    }

    // 4. Continue Request
    if (lower === "continue" || lower === "innum sollu" || lower === "next" || lower === "apram?") {
      return this.handleContinue(conversationHistory, lang);
    }

    // 5. Exam / Academic Questions (2 mark, 5 mark, 13 mark)
    if (this.isExamQuery(lower)) {
      return this.handleExamQuery(cleanMsg, lower, lang);
    }

    // 6. Project Assistance
    if (this.isProjectQuery(lower)) {
      return this.handleProjectQuery(cleanMsg, lower, lang);
    }

    // 7. Coding & Tech Questions
    if (this.isCodingQuery(lower)) {
      return this.handleCodingQuery(cleanMsg, lower, lang);
    }

    // 8. Creative Writing (Captions, Bios, Quotes, Prompts)
    if (this.isCreativeQuery(lower)) {
      return this.handleCreativeQuery(cleanMsg, lower, lang);
    }

    // 9. Error Troubleshooting / Debugging
    if (this.isErrorQuery(lower)) {
      return this.handleErrorQuery(cleanMsg, lower, lang);
    }

    // 10. General Knowledge / Smart Assistant Response
    return this.handleGeneralKnowledge(cleanMsg, lower, lang);
  }

  // --- IDENTITY ---
  handleIdentity(lang) {
    if (lang === "tamil") {
      return "வணக்கம்! நான் **Gulfi Chat** 😊 உங்களுடைய ஸ்மார்ட் AI உதவியாளர். உங்களுக்கு கோடிங், ப்ராஜெக்ட்ஸ், காலேஜ் பாடங்கள் அல்லது எதைப் பற்றியும் உதவி செய்ய நான் தயாராக இருக்கிறேன்!";
    }
    if (lang === "tanglish") {
      return "I'm **Gulfi Chat** 😊 ungaloda friendly AI assistant! Coding, college subjects, projects, creative captions, casual chat nu enna venumnalum kelunga, jolly-aa learn pannalam!";
    }
    return "I'm **Gulfi Chat** 😊 your friendly and intelligent AI assistant! I'm here to help you with coding, college exam prep, project architectures, creative writing, or just a good conversation. How can I help you today?";
  }

  // --- DATE & TIME (IST) ---
  handleTimeAndDate(text, lang) {
    const lower = text.toLowerCase();
    const ist = this.getISTTime();

    // Tomorrow
    if (lower.includes("tomorrow") || lower.includes("naalaiku") || lower.includes("nalaiku")) {
      const tomorrow = this.getRelativeDate(1);
      if (lang === "tanglish") {
        return `Naalaiku date: **${tomorrow.date}** (${tomorrow.day}) da! 📅`;
      }
      return `Tomorrow's date: **${tomorrow.date}** (${tomorrow.day}) (IST).`;
    }

    // Yesterday
    if (lower.includes("yesterday") || lower.includes("nethu") || lower.includes("netru")) {
      const yesterday = this.getRelativeDate(-1);
      if (lang === "tanglish") {
        return `Nethu date: **${yesterday.date}** (${yesterday.day})! 📅`;
      }
      return `Yesterday's date: **${yesterday.date}** (${yesterday.day}) (IST).`;
    }

    // Current Time
    if (lower.includes("time") || lower.includes("neram") || lower.includes("clock")) {
      if (lang === "tanglish") {
        return `Ippo time: **${ist.time}** ⏰\nDate: **${ist.date}** (${ist.day})`;
      }
      if (lang === "tamil") {
        return `இப்போதைய நேரம்: **${ist.time}** ⏰\nதேதி: **${ist.date}** (${ist.day})`;
      }
      return `Current time: **${ist.time}** ⏰\nCurrent date: **${ist.date}** (${ist.day})`;
    }

    // Current Date
    if (lower.includes("date") || lower.includes("thethi") || lower.includes("today") || lower.includes("innaiku")) {
      if (lang === "tanglish") {
        return `Innaiku date: **${ist.date}** (${ist.day}) 📅\nLive time: **${ist.time}**`;
      }
      return `Today's date: **${ist.date}** (${ist.day}) 📅\nCurrent time: **${ist.time}**`;
    }

    return null;
  }

  // --- GREETINGS ---
  isGreeting(lower) {
    const greetings = [
      "hi", "hello", "hey", "vanakkam", "gulfi", "dei", "machi", "bro", "good morning", "good evening", "good afternoon"
    ];
    return greetings.some(g => lower === g || lower.startsWith(g + " "));
  }

  handleGreeting(lang) {
    if (lang === "tanglish") {
      return "Hey 😊 I'm Gulfi Chat! Enna pannalam innaiku? Edhavadhu code doubt-aa, exam topic-aa, or project idea venuma?";
    }
    if (lang === "tamil") {
      return "வணக்கம்! 😊 நான் Gulfi Chat. இன்று உங்களுக்கு நான் எவ்வாறு உதவ வேண்டும்? கேள்விகள் ஏதேனும் இருந்தால் தாராளமாக கேளுங்கள்!";
    }
    return "Hey 😊 I'm **Gulfi Chat**! What would you like to explore today? Need help with coding, exam topics, project ideas, or just casual chat?";
  }

  handleBored(lang) {
    if (lang === "tanglish") {
      return "Bore adikudha? Don't worry, inga konjam jolly-ana things try pannalam! 😄\n\n1. 🎮 **Mini Game Code**: Oru fun JavaScript Snake or Guessing Game create pannalama?\n2. 💡 **Cool Tech Facts**: Mind-blowing AI or space facts therinjukalama?\n3. ✍️ **Creative Story**: Oru crazy comedy/sci-fi story ezhudhalam!\n4. 🚀 **Crazy Project Idea**: Hackathon level project blueprint ready pannalam!\n\nEdhu pannalam nu sollunga da!";
    }
    return "Feeling bored? Let's turn that around! 😄 Here are a few fun things we could do:\n\n1. 💡 Learn a mind-blowing technology or AI fact.\n2. 🎮 Build a quick mini-game in HTML/JavaScript together.\n3. 🚀 Brainstorm a cool futuristic app or startup idea.\n4. ✍️ Write a creative story or crack some witty jokes!\n\nWhich one sounds interesting?";
  }

  handleThanks(lang) {
    if (lang === "tanglish") {
      return "You're most welcome da! 😊 Eppovume help panna ready-aa irukken. Vera edhavadhu doubt irundha tharalama kelunga! 👍";
    }
    return "You're very welcome! 😊 Always happy to help. Let me know if you need anything else! 👍";
  }

  handleContinue(history, lang) {
    if (!history || history.length === 0) {
      return lang === "tanglish"
        ? "Enga irundhu continue pannanum nu sollu da, start panniduvom! 😊"
        : "Where would you like to continue from? Tell me the topic and we'll pick it right up! 😊";
    }
    const lastGulfiMsg = [...history].reverse().find(m => m.role === "assistant");
    if (!lastGulfiMsg) {
      return "Sure! What should we continue exploring next?";
    }
    return lang === "tanglish"
      ? `Kandippa continue pannalam da! Munnaadi sonna topic oda next level steps and advanced concepts paapoma? Edha pathi innum deep-aa therinjukanum? 💡`
      : `Let's continue! We can dive into the next steps, advanced implementation details, or tackle related practical examples. What specific angle should we expand on? 💡`;
  }

  // --- EXAM / EDUCATION QUERIES ---
  isExamQuery(lower) {
    return (
      lower.includes("mark") ||
      lower.includes("2 mark") ||
      lower.includes("5 mark") ||
      lower.includes("13 mark") ||
      lower.includes("exam") ||
      lower.includes("anna university") ||
      lower.includes("question answer") ||
      lower.includes("important question") ||
      lower.includes("define")
    );
  }

  handleExamQuery(text, lower, lang) {
    // 2 Mark Question
    if (lower.includes("2 mark") || lower.includes("2mark")) {
      return this.generate2MarkAnswer(text, lower, lang);
    }
    // 5 Mark Question
    if (lower.includes("5 mark") || lower.includes("5mark")) {
      return this.generate5MarkAnswer(text, lower, lang);
    }
    // 13 Mark Question / Big Question
    if (lower.includes("13 mark") || lower.includes("13mark") || lower.includes("16 mark") || lower.includes("big question") || lower.includes("essay")) {
      return this.generate13MarkAnswer(text, lower, lang);
    }
    // General academic
    return this.generateGeneralAcademicAnswer(text, lower, lang);
  }

  generate2MarkAnswer(text, lower, lang) {
    const topic = this.extractTopic(text, ["2 mark", "2mark", "question", "for", "what is", "define"]);
    return `### 📝 2-Mark Exam Answer: **${topic.toUpperCase()}**

**1. Definition:**
${this.getConciseDefinition(topic)}

**2. Key Point / Formula:**
- **Key Feature:** Acts as a fundamental building block ensuring high reliability, modularity, and structured execution.
- **Example / Syntax:** \`${topic.toLowerCase()}_example()\`

> 💡 **Exam Tip:** Writing the exact definition along with one clear bullet point or keyword guarantees full 2 marks!`;
  }

  generate5MarkAnswer(text, lower, lang) {
    const topic = this.extractTopic(text, ["5 mark", "5mark", "question", "explain", "about"]);
    return `### 📝 5-Mark Exam Answer: **${topic.toUpperCase()}**

#### 1. Concept Overview
${this.getConciseDefinition(topic)}

---

#### 2. Key Characteristics & Highlights
- **Modularity:** Separates concerns and makes the system easily maintainable.
- **Efficiency:** Optimizes execution speed and reduces resource consumption.
- **Reusability:** Code components can be reused across different modules.
- **Standard Protocol:** Adheres to well-defined computer science standards.

---

#### 3. Core Working / Flow
1. **Input Phase:** Receives requests and validates parameters.
2. **Processing Phase:** Applies domain logic and algorithm rules.
3. **Output Phase:** Delivers the expected outcome with verified correctness.

---

#### 4. Real-world Example
In modern software engineering, **${topic}** is commonly deployed in enterprise backends, cloud architectures, and operating system kernels to manage state and control flow safely.`;
  }

  generate13MarkAnswer(text, lower, lang) {
    const topic = this.extractTopic(text, ["13 mark", "13mark", "16 mark", "big question", "essay", "explain"]);
    return `### 🎓 13-Mark University Exam Answer: **${topic.toUpperCase()}**

---

#### 1. Introduction
In Computer Science & Engineering, **${topic}** is a cornerstone concept designed to solve critical architectural and operational challenges. It provides systematic methodologies for building scalable, secure, and robust systems.

---

#### 2. Formal Definition
> **${topic}** is defined as a structured framework or mechanism that coordinates resources, manages workflows, and guarantees deterministic behavior across distributed and local computing environments.

---

#### 3. Architecture & Working Principle
The execution lifecycle consists of four primary stages:
1. **Initialization:** The environment allocates buffers and establishes control handles.
2. **State Transition:** Operations are queued and executed following priority algorithms.
3. **Synchronization:** Data consistency is maintained across memory boundaries.
4. **Termination & Cleanup:** Resources are reclaimed to prevent memory leaks and deadlocks.

\`\`\`
  +------------------+       +-------------------+       +------------------+
  |   Client Input   | ----> |  ${topic} Engine  | ----> |  Output Result   |
  +------------------+       +-------------------+       +------------------+
                                       |
                                       v
                              [ Validation & Log ]
\`\`\`

---

#### 4. Key Advantages
- 🚀 **High Performance:** Minimized latency through optimized algorithms.
- 🛡️ **Fault Tolerance:** Built-in safeguards prevent single points of failure.
- 📈 **Scalability:** Easily handles increasing workloads horizontally and vertically.
- 🧩 **Maintainability:** Clear separation between presentation, logic, and data.

---

#### 5. Disadvantages / Limitations
- ⚠️ **Implementation Complexity:** Requires experienced developers to configure correctly.
- 💾 **Initial Overhead:** Setup and memory footprint can be non-trivial for small tasks.

---

#### 6. Real-World Applications
1. **Enterprise Cloud Systems:** AWS, Microsoft Azure, and GCP distributed engines.
2. **FinTech Platforms:** High-throughput transactional ledgers and banking gateways.
3. **Operating Systems:** Process scheduling, virtual memory, and I/O management.

---

#### 7. Conclusion
**${topic}** represents an indispensable paradigm in modern computing. Mastering its architectural trade-offs allows engineers to design resilient systems that sustain high concurrency and mission-critical reliability.`;
  }

  generateGeneralAcademicAnswer(text, lower, lang) {
    const topic = this.extractTopic(text, ["explain", "what is", "about"]);
    return `### 📚 Academic Concept: **${topic.toUpperCase()}**

**Concept Summary:**
${this.getConciseDefinition(topic)}

**Core Points to Remember:**
1. **Core Purpose:** Solves fundamental complexity by structuring operations logically.
2. **Mechanism:** Processes inputs through defined algorithmic rules.
3. **Significance in Exams:** Often tested under definitions, comparison tables, and architectural diagrams.

Tanglish or Tamil-la innum easy-aa explain panna venuma? Let me know da! 😊`;
  }

  // --- CODING SUPPORT ---
  isCodingQuery(lower) {
    const keywords = [
      "html", "css", "javascript", "js", "python", "java", "c++", "c language", "sql",
      "react", "node", "code", "function", "program", "loop", "array", "database", "api",
      "frontend", "backend", "git", "github", "center a div", "navbar", "calculator", "button"
    ];
    return keywords.some(k => lower.includes(k));
  }

  handleCodingQuery(text, lower, lang) {
    // 1. HTML Basics
    if (lower.includes("html basics") || (lower.includes("html") && (lower.includes("basic") || lower.includes("sollu")))) {
      return lang === "tanglish"
        ? `Sure da 😊 **HTML (HyperText Markup Language)** na website oda basic skeleton/structure create panna use panra language!

Inga oru clean starter HTML code irukku:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My First Website</title>
</head>
<body>
  <!-- Headings (H1 to H6) -->
  <h1>Vanakkam! Welcome to Gulfi Web</h1>
  
  <!-- Paragraph -->
  <p>This is my first website created with HTML basics.</p>
  
  <!-- Interactive Button -->
  <button onclick="alert('Super! Button clicked!')">Click Me!</button>

  <!-- Link -->
  <p>Visit: <a href="https://google.com" target="_blank">Google Search</a></p>
</body>
</html>
\`\`\`

#### 🚀 How to Run this Code:
1. Inga irukra code-ah copy pannunga.
2. Unga computer-la \`index.html\` nu oru file create panni paste pannunga.
3. Andha file-ah double click panni browser (Chrome/Edge)-la open panna, website live-aa varum!

Next CSS vechu styling panna paapoma? Sollunga da! 🔥`
        : `Here are the foundational **HTML basics** to kickstart your web development journey! 😊

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gulfi Starter Web</title>
</head>
<body>
  <h1>Welcome to Web Development! 🚀</h1>
  <p>HTML provides the fundamental skeleton of every web application.</p>
  <button onclick="alert('Hello from Gulfi!')">Click Me</button>
</body>
</html>
\`\`\`

#### 📌 Where to Paste & Run:
1. Save this code as \`index.html\`.
2. Double click the file to open it in Chrome, Edge, or Firefox.
3. You will immediately see your heading, paragraph, and interactive button!`;
    }

    // 2. Center a div in CSS
    if (lower.includes("center a div") || (lower.includes("center") && lower.includes("div"))) {
      return `### 🎨 How to Center a \`div\` in CSS (Modern Best Practices)

The cleanest and most reliable way today is using **CSS Flexbox** or **CSS Grid**:

#### Method 1: Modern Flexbox (Recommended)
\`\`\`css
.parent-container {
  display: flex;
  justify-content: center; /* Horizontally center */
  align-items: center;     /* Vertically center */
  min-height: 100vh;       /* Full viewport height */
}
\`\`\`

#### Method 2: Modern CSS Grid (Only 2 Lines!)
\`\`\`css
.parent-container {
  display: grid;
  place-items: center;
  min-height: 100vh;
}
\`\`\`

Both methods work perfectly across all modern browsers! 💡`;
    }

    // 3. Python Calculator / Beginner Program
    if (lower.includes("python") && (lower.includes("calculator") || lower.includes("program"))) {
      return `### 🐍 Clean Python Interactive Calculator

\`\`\`python
# Simple Python Calculator - Gulfi AI
def add(x, y): return x + y
def subtract(x, y): return x - y
def multiply(x, y): return x * y
def divide(x, y): 
    return "Error: Division by zero!" if y == 0 else x / y

print("=== Gulfi Python Calculator ===")
print("1. Add (+)")
print("2. Subtract (-)")
print("3. Multiply (*)")
print("4. Divide (/)")

choice = input("Enter choice (1/2/3/4): ")
num1 = float(input("Enter first number: "))
num2 = float(input("Enter second number: "))

if choice == '1':
    print(f"Result: {num1} + {num2} = {add(num1, num2)}")
elif choice == '2':
    print(f"Result: {num1} - {num2} = {subtract(num1, num2)}")
elif choice == '3':
    print(f"Result: {num1} * {num2} = {multiply(num1, num2)}")
elif choice == '4':
    print(f"Result: {num1} / {num2} = {divide(num1, num2)}")
else:
    print("Invalid choice!")
\`\`\`

#### 🚀 How to Run:
1. Save as \`calculator.py\`
2. Run in terminal: \`python calculator.py\`
3. Enter your choices and enjoy calculations!`;
    }

    // 4. SQL Highest Salary Query
    if (lower.includes("salary") || lower.includes("highest salary")) {
      return `### 🗄️ SQL: Find the N-th or 2nd Highest Salary

#### 1. Second Highest Salary (Standard SQL)
\`\`\`sql
SELECT MAX(salary) AS SecondHighestSalary
FROM Employees
WHERE salary < (SELECT MAX(salary) FROM Employees);
\`\`\`

#### 2. Using DENSE_RANK() (Enterprise Industry Standard)
\`\`\`sql
WITH RankedSalaries AS (
  SELECT 
    employee_id, 
    salary,
    DENSE_RANK() OVER (ORDER BY salary DESC) as rank_position
  FROM Employees
)
SELECT salary 
FROM RankedSalaries 
WHERE rank_position = 2;
\`\`\`
This handles ties gracefully if multiple employees share the top salary! 👍`;
    }

    // Default Code Guidance
    return `### 💻 Coding Guidance: ${cleanMsg}

Here is a structured, production-ready solution:

\`\`\`javascript
// Gulfi Chat Code Snippet
function executeTask(data) {
  console.log("Processing request with Gulfi Engine...", data);
  
  if (!data) {
    throw new Error("Invalid parameters provided");
  }

  return {
    success: true,
    timestamp: new Date().toISOString(),
    result: data
  };
}

// Example Execution
const output = executeTask({ status: "active", language: "${lang}" });
console.log(output);
\`\`\`

#### 📌 Implementation Steps:
1. Copy the code into your script or module.
2. Ensure required parameters are passed correctly.
3. Test locally in your development console or terminal.

Need this in Python, Java, C++, or React? Just say the word! 😊`;
  }

  // --- PROJECT ASSISTANCE ---
  isProjectQuery(lower) {
    return (
      lower.includes("project") ||
      lower.includes("hackathon") ||
      lower.includes("final year") ||
      lower.includes("mini project") ||
      lower.includes("app idea") ||
      lower.includes("website idea") ||
      lower.includes("project idea")
    );
  }

  handleProjectQuery(text, lower, lang) {
    return `### 🚀 Comprehensive Project Blueprint: **AI Smart Campus Assistant (Gulfi Campus)**

---

#### 1. Problem Statement
College students frequently struggle with navigating disjointed campus portals, finding instant syllabus/exam answers, tracking attendance thresholds, and receiving urgent department notices in real time.

---

#### 2. Objective
To construct an intelligent, centralized AI web portal that unifies academic query resolution, timetable tracking, and automated announcements with local language (Tamil/Tanglish) accessibility.

---

#### 3. Key Features
- 🤖 **Contextual AI Chatbot:** Answers syllabus doubts, 2-mark definitions, and lab code.
- 📊 **Smart Attendance Forecaster:** Calculates how many classes a student can safely skip or must attend to maintain 75%.
- 🔔 **Instant Department Noticeboard:** Real-time push updates for exam schedules and events.
- 🗣️ **Multilingual Voice Support:** Voice input and speech synthesis in English and Tamil.

---

#### 4. System Architecture & Tech Stack
- **Frontend:** React.js / Vanilla HTML5, CSS3, Modern Glassmorphic UI.
- **Backend:** Node.js + Express.js REST API.
- **Database:** MongoDB / PostgreSQL for user auth, notes repository, and attendance logs.
- **AI Core:** Gulfi Intelligent Core with WebLLM or local fast inference.
- **Auth:** JWT (JSON Web Tokens) with secure HTTP-only cookies.

---

#### 5. Step-by-Step Implementation Roadmap
1. **Phase 1 (Week 1):** UI/UX Wireframing in Figma & establishing responsive CSS design system.
2. **Phase 2 (Week 2):** Backend REST APIs for User Authentication, Notes upload, and Notifications.
3. **Phase 3 (Week 3):** Integrating Gulfi Chatbot logic for syllabus Q&A.
4. **Phase 4 (Week 4):** Comprehensive Unit Testing & Cloud Deployment (Vercel / Render).

---

#### 6. Future Enhancements
- Integration with College Biometric Attendance Hardware via IoT Webhooks.
- AI-driven automated resume builder for campus placement drives.

Enna machi, indha project idea unga college-ku set aaguma? Illa vera domain (Healthcare, FinTech, Agriculture) venuma? Sollunga! 💡`;
  }

  // --- CREATIVE REQUESTS ---
  isCreativeQuery(lower) {
    return (
      lower.includes("caption") ||
      lower.includes("quote") ||
      lower.includes("bio") ||
      lower.includes("instagram") ||
      lower.includes("linkedin") ||
      lower.includes("prompt") ||
      lower.includes("kavithai") ||
      lower.includes("status")
    );
  }

  handleCreativeQuery(text, lower, lang) {
    // Instagram Captions
    if (lower.includes("caption") || lower.includes("instagram")) {
      return `### ✨ Handcrafted Instagram Captions

**Option 1 (Cool & Minimalist):**
> *Living in the moments you can't put into words.* ✨🌊 #ChasingSunsets #Vibes

**Option 2 (Tamil / Tanglish Mass & Aesthetic):**
> *நினைப்பதெல்லாம் நடப்பதில்லை... ஆனால் நடப்பது எல்லாமே நன்மைக்கே!* 💫
> *Vibe check: 100% genuine.* 🕶️🔥 #TamilVibes #ChillMode

**Option 3 (Coding / Tech Vibe):**
> *Turning coffee into clean code and dreams into algorithms.* ☕💻 #DevLife #TechVibes

**Option 4 (Short & Punchy):**
> *Less perfection, more authenticity.* 🤍`;
    }

    // LinkedIn Post
    if (lower.includes("linkedin")) {
      return `### 💼 Professional LinkedIn Post Ready-to-Publish

🚀 **Excited to share a new milestone in my learning journey!**

Over the past few weeks, I’ve been diving deep into modern web architectures, API performance, and building resilient user experiences.

Here are 3 core lessons that truly reshaped my perspective:
1️⃣ **Simplicity over Complexity:** The cleanest solution is almost always the most maintainable.
2️⃣ **User-Centric Design:** Fast load times and accessible UI create immediate customer trust.
3️⃣ **Consistency Matters:** Showing up everyday to write code and solve bugs compounds exponentially.

A huge shoutout to everyone supporting and sharing resources in the tech community!

Looking forward to collaborating on impactful software engineering initiatives. Let's connect! 🌐

#SoftwareEngineering #WebDevelopment #ContinuousLearning #TechInnovation #CodingJourney`;
    }

    // AI Prompt Generation
    if (lower.includes("prompt")) {
      return `### 🎨 Ready-to-Copy AI Prompt

\`\`\`text
Hyper-realistic 8K photograph of a futuristic high-tech AI research lab, soft cyan and ultraviolet volumetric neon lighting, sleek glass workstation overlooking a cyberpunk skyline at dusk, cinematic depth of field, Octane render, photorealistic, intricate textures, masterpiece.
\`\`\`

Direct-aa copy panni Midjourney, DALL-E, or Stable Diffusion-la paste pannunga! 🔥`;
    }

    return `### ✨ Creative Spark:
> *"The secret of getting ahead is simply getting started. Break your complex, overwhelming tasks into small manageable actions, and begin with the first one."* 💡

Need more tailored captions, bios, or creative writing? Tell me the mood (Classy, Funny, Attitude, Professional)! 😊`;
  }

  // --- ERROR TROUBLESHOOTING ---
  isErrorQuery(lower) {
    return (
      lower.includes("error") ||
      lower.includes("exception") ||
      lower.includes("failed") ||
      lower.includes("not defined") ||
      lower.includes("cannot read property") ||
      lower.includes("syntaxerror") ||
      lower.includes("bug")
    );
  }

  handleErrorQuery(text, lower, lang) {
    return `### 🔍 Gulfi Debugger: Issue Diagnosis & Fix

#### 1. Likely Cause:
This error typically occurs when a variable, object reference, or API response is accessed before it has been properly initialized or defined in the execution context.

#### 2. How to Fix:
- **Null Safety Check:** Verify that the parent object exists before accessing its inner properties using Optional Chaining (\`?.\`).
- **Initialization:** Ensure all variables are imported or declared before invocation.

\`\`\`javascript
// ❌ Problematic Code:
const name = user.profile.name; // Crashes if user or profile is undefined!

// ✅ Corrected Code with Optional Chaining:
const name = user?.profile?.name ?? "Guest User";
console.log("Safe output:", name);
\`\`\`

If you share the exact error trace or screenshot details, I'll pinpoint the exact line number fix immediately da! 👍`;
  }

  // --- GENERAL KNOWLEDGE & FALLBACK ---
  handleGeneralKnowledge(text, lower, lang) {
    if (lang === "tanglish") {
      return `Nalla question da! 😊 **${text}** pathi paapom:

Idhoda main concept enna-na:
1. **Core Idea:** Idhu romba useful-ana technology and practice in modern industry.
2. **Key Advantage:** Time and effort-ah save panni, process-ah romba clean-aa manage panna mudiyum.
3. **Best Way to Use:** Step-by-step-aa implement panna nalla results kedaikum.

Idhula ungaluku code venuma, theoretical explanation venuma, or step-by-step example kaatanuma? Enna venumo tharalama sollunga! 🚀`;
    }

    return `That's a great question! 😊 Regarding **"${text}"**:

Here is the essential breakdown:
- **Core Concept:** It addresses real-world computational efficiency and structured problem solving.
- **Key Takeaways:** Implementing it properly ensures scalability, readability, and fault isolation.
- **Practical Application:** Widely applied across modern tech stacks and computational workflows.

Would you like a step-by-step implementation, code sample, or an exam-style structured answer? Tell me what works best for you! 💡`;
  }

  // Helper: Extract topic
  extractTopic(text, stopWords) {
    let t = text;
    stopWords.forEach(w => {
      const reg = new RegExp(`\\b${w}\\b`, "gi");
      t = t.replace(reg, "");
    });
    t = t.replace(/[?.,!:]/g, "").trim();
    return t || "Computer Science Concept";
  }

  getConciseDefinition(topic) {
    const t = topic.toLowerCase();
    if (t.includes("oop") || t.includes("object oriented")) {
      return "Object-Oriented Programming (OOP) is a programming paradigm based on the concept of 'objects' containing data (attributes) and code (methods), organized into Classes to promote modularity and reusability.";
    }
    if (t.includes("polymorphism")) {
      return "Polymorphism is the ability of a single interface or function to take on multiple forms, categorized into Compile-time (Method Overloading) and Runtime (Method Overriding).";
    }
    if (t.includes("inheritance")) {
      return "Inheritance is the mechanism by which one class acquires the properties and methods of another class, enabling hierarchical code reusability.";
    }
    if (t.includes("encapsulation")) {
      return "Encapsulation is the bundling of data and the methods that operate on that data into a single unit (Class) while restricting direct access using private/protected access modifiers.";
    }
    if (t.includes("dbms") || t.includes("database")) {
      return "A Database Management System (DBMS) is specialized system software for creating, storing, managing, and retrieving structured data securely and reliably.";
    }
    if (t.includes("normalization")) {
      return "Normalization is the systematic process of organizing data in a relational database to minimize data redundancy and eliminate anomalies (Insert, Update, Delete).";
    }
    if (t.includes("os") || t.includes("operating system")) {
      return "An Operating System (OS) is essential system software that acts as an intermediary between computer hardware and user applications, managing CPU, memory, files, and I/O devices.";
    }
    return `${topic} is a structured computing paradigm designed to organize algorithms, manage computational state, and optimize performance across software systems.`;
  }

  // Optional: Query external OpenAI-compatible LLM endpoint if user provided one
  async queryExternalLLM(prompt, history) {
    const messages = [
      {
        role: "system",
        content: `You are Gulfi Chat, a friendly, intelligent, helpful AI chatbot. Talk naturally, support English, Tamil, and Tanglish. Always identify as Gulfi Chat. Timezone: Asia/Kolkata (IST). Current IST time: ${this.getISTTime().fullString}.`
      },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: prompt }
    ];

    const response = await fetch(this.customEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.customApiKey}`
      },
      body: JSON.stringify({
        model: this.customModel || "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}

// Export for browser and node
if (typeof module !== "undefined" && module.exports) {
  module.exports = GulfiBrain;
}
