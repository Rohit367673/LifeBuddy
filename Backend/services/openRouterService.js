const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'openai/gpt-4o-mini'; // Using a better model for more detailed responses

// Debug logging
console.log('OpenRouter API Key loaded:', OPENROUTER_API_KEY ? 'YES' : 'NO');
console.log('OpenRouter API Key (first 10 chars):', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'NOT SET');

// Comprehensive fallback content generator
function generateDetailedFallbackContent(topic, dayNumber) {
  const fallbackContent = {
    'java': {
      title: `📚 Day ${dayNumber}: Learn Java Programming`,
      content: `🎯 **What You'll Learn Today:**
Java is a powerful, object-oriented programming language used for building web applications, mobile apps, and enterprise software. Today, you'll discover why Java is essential for modern software development and learn the foundational concepts that will set you on the path to becoming a proficient Java developer.

📖 **Deep Dive - Understanding Java Fundamentals:**

**What is Java?**
Java is a high-level, object-oriented programming language developed by Sun Microsystems (now Oracle) in 1995. It's designed to be platform-independent, meaning Java code can run on any device that has a Java Virtual Machine (JVM).

**Key Features:**
• **Platform Independence:** Write once, run anywhere (WORA)
• **Object-Oriented:** Organize code using classes and objects
• **Strong Typing:** Variables must be declared with specific data types
• **Automatic Memory Management:** Garbage collection handles memory cleanup

💻 **Key Concepts to Master:**

**1. Classes and Objects:**
Think of a class as a blueprint and objects as the actual things you create from that blueprint. For example:

public class Car {
    String brand;
    String model;
    
    public void start() {
        System.out.println("Car is starting...");
    }
}

**2. Variables and Data Types:**
Java has several data types:
• \`int\` - whole numbers (e.g., 42)
• \`double\` - decimal numbers (e.g., 3.14)
• \`String\` - text (e.g., "Hello World")
• \`boolean\` - true/false values

**3. Methods:**
Methods are blocks of code that perform specific tasks:

public static void main(String[] args) {
    System.out.println("Hello, World!");
}

🛠️ **Hands-On Practice:**

**Your First Java Program:**

public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
        System.out.println("Welcome to Java Programming!");
    }
}

**Practice Exercise:**
Create a simple program that declares variables for your name, age, and favorite programming language, then prints them to the console.

📚 **Essential Resources:**
• **Oracle Java Documentation:** https://docs.oracle.com/javase/tutorial/
• **W3Schools Java Tutorial:** https://www.w3schools.com/java/
• **YouTube:** "Java for Beginners" by Programming with Mosh
• **Practice Platforms:** HackerRank, LeetCode, CodeWars
• **IDE Recommendations:** IntelliJ IDEA, Eclipse, VS Code

🚀 **Pro Tips & Best Practices:**
• Always use meaningful variable names (firstName, not f)
• Comment your code to explain what you're doing
• Practice typing code manually - don't just copy-paste
• Learn to read error messages - they're your friends!
• Use consistent indentation and formatting

🎯 **Today's Challenge:**
Create a simple calculator that can add two numbers. This will teach you about:
• Variable declaration and initialization
• User input handling
• Basic arithmetic operations
• Output formatting

💪 **Motivation & Mindset:**
Remember: Every expert was once a beginner. Java has been around for 25+ years and is still in high demand. You're learning a skill that can open doors to amazing career opportunities. Stay patient, practice daily, and celebrate every small victory!

**Quote of the Day:** "The only way to learn a new programming language is by writing programs in it." - Dennis Ritchie

🎯 **Success Criteria:**
By the end of today, you should be able to:
• Explain what Java is and why it's important
• Write and run a simple "Hello World" program
• Understand basic Java syntax and structure
• Feel confident about your learning journey!`
    },
    'python': {
      title: `📚 Day ${dayNumber}: Learn Python Programming`,
      content: `🎯 **What You'll Learn Today:**
Python is a versatile, beginner-friendly programming language perfect for web development, data science, and automation. Today, you'll discover why Python is the perfect language for beginners and experts alike, and learn the foundational concepts that will set you on the path to becoming a proficient Python developer.

📖 **Deep Dive - Understanding Python Fundamentals:**

**What is Python?**
Python is a high-level, interpreted programming language created by Guido van Rossum in 1991. It's designed to be as close to human language as possible, making it perfect for learning programming concepts.

**Key Features:**
• **Simple Syntax:** Clean and readable code structure
• **Extensive Libraries:** Rich ecosystem for various applications
• **Dynamic Typing:** Variables don't need type declaration
• **Cross-Platform:** Runs on Windows, Mac, Linux

💻 **Key Concepts to Master:**

**1. Variables and Data Types:**
Python makes variable declaration simple:

name = "John"          # String
age = 25              # Integer
height = 5.9          # Float
is_student = True     # Boolean

**2. Functions:**
Functions are reusable blocks of code:

def greet(name):
    return f"Hello, {name}!"

print(greet("World"))

**3. Control Structures:**

if age >= 18:
    print("You are an adult")
else:
    print("You are a minor")

🛠️ **Hands-On Practice:**

**Your First Python Program:**

print("Hello, World!")
name = input("What's your name? ")
print(f"Nice to meet you, {name}!")

**Practice Exercise:**
Create a program that calculates the area of a circle given its radius. Use the formula: area = π × radius²

📚 **Essential Resources:**
• **Python.org Official Tutorial:** https://docs.python.org/3/tutorial/
• **Automate the Boring Stuff with Python:** https://automatetheboringstuff.com/
• **YouTube:** "Python for Beginners" by Programming with Mosh
• **Practice Platforms:** Replit, Jupyter Notebooks, HackerRank
• **IDE Recommendations:** PyCharm, VS Code, IDLE

🚀 **Pro Tips & Best Practices:**
• Use descriptive variable names
• Write docstrings to document your functions
• Use virtual environments for different projects
• Learn to use pip for installing packages
• Follow PEP 8 style guidelines

🎯 **Today's Challenge:**
Create a simple guessing game where the computer picks a random number and you try to guess it. This teaches you about:
• Random number generation
• Loops and conditionals
• User input handling
• Game logic implementation

💪 **Motivation & Mindset:**
Python is used by Google, Netflix, Instagram, and NASA! You're learning a language that powers the modern web, AI, data science, and so much more. Every line of code you write is a step toward building something amazing.

**Quote of the Day:** "Python is an experiment in how much freedom programmers need." - Guido van Rossum

🎯 **Success Criteria:**
By the end of today, you should be able to:
• Explain what Python is and why it's popular
• Write and run simple Python programs
• Understand basic Python syntax and structure
• Feel excited about your programming journey!`
    },
    'javascript': {
      title: `📚 Day ${dayNumber}: Learn JavaScript Programming`,
      content: `🎯 **What You'll Learn Today:**
JavaScript is the language of the web - it makes websites interactive, dynamic, and engaging. Today, you'll discover how JavaScript brings the internet to life and learn the foundational concepts that will set you on the path to becoming a proficient JavaScript developer.

📖 **Deep Dive - Understanding JavaScript Fundamentals:**

**What is JavaScript?**
JavaScript is a high-level, interpreted programming language that runs in web browsers. It's what makes buttons clickable, forms validate, and websites respond to user actions.

**Key Features:**
• **Client-Side Scripting:** Runs in the browser
• **Event-Driven:** Responds to user interactions
• **Asynchronous:** Can handle multiple tasks simultaneously
• **Dynamic Typing:** Variables can change types

💻 **Key Concepts to Master:**

**1. Variables and Data Types:**

let name = "John";        // String
const age = 25;          // Number
let isStudent = true;    // Boolean
let hobbies = ["coding", "reading"]; // Array
let person = {name: "John", age: 25}; // Object

**2. Functions:**

function greet(name) {
    return \`Hello, \${name}!\`;
}

// Arrow function (modern syntax)
const greetArrow = (name) => \`Hello, \${name}!\`;

**3. DOM Manipulation:**

// Change text content
document.getElementById("title").textContent = "New Title";

// Add event listener
document.getElementById("button").addEventListener("click", function() {
    alert("Button clicked!");
});

🛠️ **Hands-On Practice:**

**Your First JavaScript Program:**

console.log("Hello, World!");
let name = prompt("What's your name?");
alert("Nice to meet you, " + name + "!");

**Practice Exercise:**
Create a simple HTML page with JavaScript that changes text color when clicked.

📚 **Essential Resources:**
• **MDN Web Docs:** https://developer.mozilla.org/en-US/docs/Web/JavaScript
• **JavaScript.info:** https://javascript.info/
• **YouTube:** "JavaScript Full Course" by freeCodeCamp
• **Practice Platforms:** CodePen, JSFiddle, Replit
• **IDE Recommendations:** VS Code, WebStorm, Sublime Text

🚀 **Pro Tips & Best Practices:**
• Use const by default, let when you need to reassign
• Learn ES6+ features (arrow functions, destructuring, modules)
• Understand asynchronous programming (callbacks, promises, async/await)
• Use meaningful variable and function names
• Practice in the browser console

🎯 **Today's Challenge:**
Create a simple to-do list where you can add and remove items. This teaches you about:
• Arrays and array methods
• DOM manipulation
• Event handling
• Local storage

💪 **Motivation & Mindset:**
JavaScript is everywhere - on every website, in mobile apps, and even on servers! You're learning the most popular programming language in the world. Every website you visit uses JavaScript.

**Quote of the Day:** "Any application that can be written in JavaScript, will eventually be written in JavaScript." - Jeff Atwood

🎯 **Success Criteria:**
By the end of today, you should be able to:
• Explain what JavaScript is and why it's important
• Write and run simple JavaScript programs
• Understand basic JavaScript syntax and structure
• Feel confident about building interactive web experiences!`
    }
  };

  // Extract topic keyword (java, python, javascript, etc.)
  const topicLower = topic.toLowerCase();
  let selectedTopic = 'java'; // default
  
  if (topicLower.includes('python')) selectedTopic = 'python';
  else if (topicLower.includes('javascript') || topicLower.includes('js')) selectedTopic = 'javascript';
  else if (topicLower.includes('java')) selectedTopic = 'java';

  return fallbackContent[selectedTopic] || fallbackContent['java'];
}

// Fallback static message
const FALLBACK_MESSAGE = 'Stay focused and positive! You are making great progress.';

async function generateDetailedMotivationalMessage(topic, dayNumber) {
  // For now, let's use the fallback content to ensure it fits Telegram's limit
  console.log('Using fallback content to ensure Telegram compatibility');
  const fallback = generateDetailedFallbackContent(topic, dayNumber);
  const shortContent = `${fallback.title}\n\nToday you'll learn about ${topic} fundamentals.\nPractice: Start with a simple "Hello World" program.\n💡 Tip: Every expert was once a beginner!\n🎯 You're on your way to success!`;
  return shortContent;
}

// Function to create Telegram-compatible short version
function createTelegramShortVersion(fullContent, topic, dayNumber) {
  return `📚 Day ${dayNumber}: ${topic}

🎯 Today's Focus:
• Learn ${topic} fundamentals and core concepts
• Write your first program
• Understand basic syntax and structure

💻 Key Learning:
• Variables, data types, and basic operations
• Writing and running your first program
• Understanding the development environment

🛠️ Practice Exercise:
Create a simple "Hello World" program and run it successfully.

📚 Resources:
• Official documentation and tutorials
• YouTube beginner courses
• Practice on HackerRank/LeetCode

💪 Motivation:
Every expert was once a beginner. You're taking the first step toward becoming a skilled ${topic} developer. Stay patient, practice daily, and celebrate every small victory!

🎯 Success Goal:
By today's end, you'll write and run your first ${topic} program confidently!`;
}

// Function to split comprehensive content into multiple Telegram messages
function splitContentIntoMessages(fullContent, topic, dayNumber) {
  const messages = [];
  
  // Message 1: Introduction and Learning Objectives
  const introMessage = `📚 Day ${dayNumber}: ${topic}

🎯 What You'll Learn Today:
• Core fundamentals and key concepts
• Essential syntax and structure
• Your first program and hands-on practice

💡 Why This Matters:
${topic} is a powerful programming language used in web development, mobile apps, and enterprise software. Understanding it opens doors to amazing career opportunities!

🚀 Today's Goal:
By the end of today, you'll write and run your first ${topic} program confidently!`;

  messages.push(introMessage);

  // Message 2: Deep Dive and Examples
  const deepDiveMessage = `📖 Deep Dive - Understanding ${topic}:

🔍 Key Concepts:
• Variables and data types
• Basic syntax and structure
• Writing your first program

💻 Code Example:
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}

🎯 Practice Exercise:
Create a simple program that prints your name and age to the console.`;

  messages.push(deepDiveMessage);

  // Message 3: Resources and Motivation
  const resourcesMessage = `📚 Essential Resources:

🔗 Official Documentation:
• Oracle Java Documentation: https://docs.oracle.com/javase/tutorial/
• W3Schools Java Tutorial: https://www.w3schools.com/java/

🎥 Video Courses:
• "Java for Beginners" by Programming with Mosh
• "Complete Java Course" by freeCodeCamp

💪 Practice Platforms:
• HackerRank Java challenges
• LeetCode beginner problems
• CodeWars katas

🎯 Motivation:
Every expert was once a beginner! You're taking the first step toward becoming a skilled ${topic} developer. Stay patient, practice daily, and celebrate every small victory!

💡 Pro Tip: Start with small programs and gradually build complexity. Focus on understanding the logic before worrying about advanced features.`;

  messages.push(resourcesMessage);

  return messages;
}

async function generateMessageWithOpenRouter(prompt, maxTokens = 100) {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set in .env');
    return FALLBACK_MESSAGE;
  }
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7 // Add some creativity while maintaining coherence
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return FALLBACK_MESSAGE;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content || FALLBACK_MESSAGE;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return FALLBACK_MESSAGE;
  }
}

async function generateScheduleWithOpenRouter(title, requirements, startDate, endDate) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
  const schedule = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date(new Date(startDate).getTime() + i * 24*60*60*1000);
    
    // Use a comprehensive prompt for rich educational content
    const prompt = `You are an expert programming tutor creating a comprehensive Day ${i+1} learning plan for "${title}".

Create a detailed, educational response that includes:

📚 **Day ${i+1}: ${title}**

🎯 **What You'll Learn Today:**
- Provide a clear overview of today's learning objectives
- Explain why this topic is important
- Use analogies to make concepts relatable

📖 **Deep Dive - Understanding the Fundamentals:**
- Give detailed explanations of core concepts
- Include key definitions and principles
- Use examples and step-by-step explanations
- Address common beginner questions

💻 **Key Concepts to Master:**
- Break down complex topics into digestible pieces
- Explain each concept with practical examples
- Include "Aha!" moments and insights

🛠️ **Hands-On Practice:**
- Provide specific code examples
- Include step-by-step instructions
- Give practice problems with solutions

📚 **Essential Resources:**
- Include specific links to tutorials, documentation, videos
- Explain why each resource is valuable
- Include both free and premium options

🚀 **Pro Tips & Best Practices:**
- Share insider knowledge and industry best practices
- Warn about common pitfalls
- Provide efficiency tips

🎯 **Today's Challenge:**
- Create a specific, achievable challenge
- Include success criteria
- Make it engaging and motivating

💪 **Motivation & Mindset:**
- Provide powerful, relevant motivational content
- Include inspiring quotes or success stories
- Address common mental blocks

Make it comprehensive, educational, and inspiring like ChatGPT or DeepSeek would provide. Focus on actually teaching the user, not just giving commands.`;

    let response;
    try {
      response = await generateMessageWithOpenRouter(prompt, 800);
    } catch (error) {
      console.error('Failed to generate AI content, using fallback');
      response = FALLBACK_MESSAGE;
    }
    
    // If AI generation fails, use comprehensive fallback content
    if (response === FALLBACK_MESSAGE) {
      const fallbackContent = generateDetailedFallbackContent(title, i + 1);
      response = fallbackContent.content;
    }
    
    // Create the correct structure for PremiumTask validation
    schedule.push({
      date: date,
      subtask: `Day ${i+1} - ${title}`, // Required field
      status: 'pending',
      motivationTip: response,
      resources: [
        'Oracle Java Documentation: https://docs.oracle.com/javase/tutorial/',
        'W3Schools Java Tutorial: https://www.w3schools.com/java/',
        'YouTube: "Java for Beginners" by Programming with Mosh',
        'Practice on: HackerRank, LeetCode, CodeWars'
      ],
      exercises: [
        'Write your first "Hello World" program',
        'Create a simple calculator',
        'Practice with variables and data types',
        'Build a basic class structure'
      ],
      notes: response,
      day: i + 1
    });
  }
  return schedule;
}

module.exports = { 
  generateMessageWithOpenRouter, 
  generateScheduleWithOpenRouter,
  generateDetailedMotivationalMessage,
  createTelegramShortVersion,
  splitContentIntoMessages
}; 