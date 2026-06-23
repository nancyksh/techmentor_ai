from crewai import Agent
from .tools import RAGSearchTool, DigitalTwinUpdateTool

class TechMentorAgents:
    def __init__(self, llm):
        self.llm = llm

    def professor_agent(self):
        return Agent(
            role='Professor Agent (Master Orchestrator)',
            goal='Understand user learning goals, create a comprehensive learning strategy, and coordinate all other agents.',
            backstory='An experienced and highly intelligent academic professor. You are the master orchestrator of the learning journey.',
            verbose=True,
            allow_delegation=True,
            llm=self.llm
        )

    def research_agent(self):
        return Agent(
            role='Research Agent',
            goal='Retrieve the most relevant and accurate educational content from the knowledge base for the current topic.',
            backstory='A meticulous academic researcher who can find the needle in the haystack in vast knowledge bases.',
            tools=[RAGSearchTool()],
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def teaching_agent(self):
        return Agent(
            role='Teaching Agent',
            goal='Explain complex concepts clearly, generate notes, and provide examples.',
            backstory='A gifted teacher who simplifies complex topics into easy-to-understand explanations with relatable examples.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def quiz_agent(self):
        return Agent(
            role='Quiz Agent',
            goal='Create adaptive quizzes including MCQs, subjective, and coding questions based on the current topic.',
            backstory='An expert examiner who designs questions that truly test deep understanding, not just rote memorization.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def evaluation_agent(self):
        return Agent(
            role='Evaluation Agent',
            goal='Grade answers, analyze mistakes, and calculate mastery scores.',
            backstory='A fair but strict evaluator who provides constructive feedback and accurately assesses student mastery.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def reflection_agent(self):
        return Agent(
            role='Reflection Agent',
            goal='Identify misconceptions, determine knowledge gaps, and suggest next actions.',
            backstory='A psychological learning expert who understands why students make mistakes and how to correct their mental models.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def planner_agent(self):
        return Agent(
            role='Planner Agent',
            goal='Generate and dynamically modify the personalized study roadmap.',
            backstory='An organized study planner who optimizes learning schedules for maximum retention and efficiency.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def interview_panel_agent(self):
        # We consolidate the sub-agents into one agent that acts as a panel, or we can create 3 separate agents.
        # For simplicity in orchestration, one agent simulating the panel is efficient.
        return Agent(
            role='Interview Panel',
            goal='Conduct mock interviews (Technical, HR), evaluate communication, and generate placement reports.',
            backstory='A panel of strict industry veterans (Technical Lead, HR Manager, Recruiter) evaluating a candidate for a top-tier tech job.',
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )

    def memory_agent(self):
        return Agent(
            role='Memory Agent',
            goal='Maintain the long-term student profile and update the Digital Twin database.',
            backstory='The keeper of records. You ensure that every interaction is recorded and the Student Digital Twin is perfectly up-to-date.',
            tools=[DigitalTwinUpdateTool()],
            verbose=True,
            allow_delegation=False,
            llm=self.llm
        )
