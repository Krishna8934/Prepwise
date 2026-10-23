export const SAMPLE_RESUMES = [
  {
    id: 'fullstack',
    role: 'Full-Stack Software Engineer',
    name: 'Alex Rivera',
    description: 'Specializes in React, Node.js, Python, PostgreSQL, and scalable microservices.',
    text: `Alex Rivera
Senior Full-Stack Engineer | Seattle, WA | alex.rivera@example.com

SUMMARY:
Results-driven Full-Stack Engineer with 4+ years of experience building high-throughput web applications, RESTful microservices, and reactive frontends. Experienced in React, TypeScript, Node.js, Python (FastAPI), and AWS cloud deployments.

TECHNICAL SKILLS:
• Programming Languages: JavaScript, TypeScript, Python, SQL, Go
• Frontend: React, Next.js, Tailwind CSS, Redux Toolkit, WebSockets
• Backend: Node.js, Express, FastAPI, Django, GraphQL, REST APIs
• Databases & Caching: PostgreSQL, MongoDB, Redis, DynamoDB
• DevOps & Cloud: Docker, Kubernetes, AWS (EC2, S3, Lambda), CI/CD (GitHub Actions)

WORK EXPERIENCE:
Senior Software Engineer | CloudScale Tech (2022 - Present)
• Architected a real-time collaborative dashboard used by 120k+ daily active users using React and WebSockets, reducing latency by 45%.
• Designed scalable microservices in FastAPI with PostgreSQL, implementing Redis caching to handle 5,000+ requests per second.
• Spearheaded migration from legacy monolithic backend to containerized Docker services orchestrated with Kubernetes.

Software Engineer | Innovate Labs (2020 - 2022)
• Developed responsive client portals using Next.js and TypeScript with 99.8% crash-free sessions.
• Optimized complex SQL queries and database indexing, reducing average API response times from 420ms to 85ms.

PROJECTS:
1. Distributed E-Commerce Order Processing Engine (Go, Kafka, Redis, PostgreSQL)
• Built an event-driven asynchronous order fulfillment pipeline with Kafka and Redis distributed locks to prevent double-spending during peak flash sales.
2. AI-Powered Code Review Assistant (Python, FastAPI, React, OpenAI API)
• Developed a developer tool that automatically analyzes pull requests for security vulnerabilities and style violations, used by 15 engineering squads.

EDUCATION:
B.S. in Computer Science | University of Washington`
  },
  {
    id: 'ai_ml',
    role: 'Machine Learning & AI Engineer',
    name: 'Dr. Sarah Chen',
    description: 'Expertise in Deep Learning, PyTorch, Churn Prediction, LLM Fine-tuning, and MLOps.',
    text: `Sarah Chen
Machine Learning Engineer | San Francisco, CA | sarah.chen@example.com

SUMMARY:
Machine Learning Engineer with strong background in supervised learning, NLP, LLM agents, and real-time inference systems. Proven track record of taking ML models from research to production with PyTorch, Scikit-Learn, and FastAPI.

TECHNICAL SKILLS:
• ML & Deep Learning: PyTorch, TensorFlow, Scikit-Learn, XGBoost, Transformers, HuggingFace
• Languages: Python, C++, SQL, R
• MLOps & Tools: MLflow, Ray, Docker, Triton Inference Server, DVC, AWS SageMaker
• Data Engineering: Pandas, NumPy, Spark, Airflow, Vector Databases (Pinecone, ChromaDB)

WORK EXPERIENCE:
ML Engineer | DataNex AI (2022 - Present)
• Built an end-to-end Customer Churn Prediction System using Random Forest and XGBoost with automated feature engineering, reducing enterprise customer churn by 18%.
• Deployed low-latency transformer inference pipelines on AWS SageMaker with ONNX runtime, serving 2M+ daily predictions at sub-30ms latency.

AI Research Fellow | Horizon Labs (2020 - 2022)
• Researched contrastive learning techniques and retrieval-augmented generation (RAG) architectures for domain-specific question answering.

PROJECTS:
1. Customer Churn Prediction Engine (Random Forest, Scikit-Learn, FastAPI, Streamlit)
• Formulated feature importance and SHAP value explainability pipelines to provide actionable retention recommendations to account managers.
2. Retrieval-Augmented Generation Agent for Biomedical Literature (PyTorch, Pinecone, Llama-3)
• Indexed 500k+ research papers with dense embeddings, achieving 92% retrieval accuracy for medical domain Q&A.

EDUCATION:
M.S. in Artificial Intelligence | Stanford University`
  },
  {
    id: 'backend',
    role: 'Backend & Systems Architect',
    name: 'Marcus Vance',
    description: 'Focused on Go, Distributed Systems, High-Concurrency APIs, and Fault Tolerance.',
    text: `Marcus Vance
Backend & Distributed Systems Engineer | Austin, TX | marcus.vance@example.com

SUMMARY:
Systems-oriented Backend Engineer with expertise in building fault-tolerant distributed systems, low-latency microservices, and event-driven architectures in Go and Java. Passionate about concurrency, database internals, and zero-downtime deployments.

TECHNICAL SKILLS:
• Languages: Go, Java, C++, Rust, SQL
• Systems & Architecture: Distributed Systems, Concurrency, Microservices, Event-Driven Architecture, gRPC, Protobuf
• Infrastructure: Kubernetes, Kafka, Envoy, Redis, PostgreSQL, Prometheus, Grafana

WORK EXPERIENCE:
Lead Backend Engineer | Apex Distributed Systems (2021 - Present)
• Engineered high-throughput payment settlement microservices in Go handling $40M+ in daily transaction volume with 99.999% uptime.
• Implemented distributed rate limiting and circuit breaking using Redis and Envoy, mitigating cascading failures during network partitions.

PROJECTS:
1. Distributed Key-Value Store (Go, Raft Consensus, LSM-Tree)
• Implemented the Raft consensus algorithm from scratch in Go to ensure linearizable consistency across cluster nodes.
2. Real-Time Telemetry Processing Stream (Kafka, Flink, ClickHouse)
• Processed 100,000 events/sec with dynamic aggregation and real-time anomaly detection.

EDUCATION:
B.S. in Computer Engineering | UT Austin`
  }
];
