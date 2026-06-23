from crewai import Crew, Process
from .agents import TechMentorAgents
from crewai import Task

class TechMentorCrew:
    def __init__(self, llm):
        self.agents_factory = TechMentorAgents(llm=llm)

    def run_autonomous_mode(self, user_id: str, current_goal: str):
        professor = self.agents_factory.professor_agent()
        planner = self.agents_factory.planner_agent()
        research = self.agents_factory.research_agent()
        teaching = self.agents_factory.teaching_agent()
        quiz = self.agents_factory.quiz_agent()
        reflection = self.agents_factory.reflection_agent()
        memory = self.agents_factory.memory_agent()

        # Task 1: Professor Analyzes Goal and Plans
        task1 = Task(
            description=f"Analyze the learning goal '{current_goal}' for user {user_id}. Create a high-level strategy.",
            expected_output="A high-level learning strategy document.",
            agent=professor
        )

        # Task 2: Planner creates roadmap
        task2 = Task(
            description="Based on the strategy, generate a detailed step-by-step roadmap.",
            expected_output="A detailed roadmap with topics and timelines.",
            agent=planner
        )

        # Task 3: Research gathers content for first topic
        task3 = Task(
            description="Identify the first topic from the roadmap and gather detailed educational content using the RAG tool.",
            expected_output="Comprehensive educational notes for the first topic.",
            agent=research
        )

        # Task 4: Memory updates Digital Twin
        task4 = Task(
            description=f"Update the Digital Twin for user {user_id} indicating that they have started studying the first topic.",
            expected_output="Confirmation of Digital Twin update.",
            agent=memory
        )

        crew = Crew(
            agents=[professor, planner, research, memory],
            tasks=[task1, task2, task3, task4],
            process=Process.sequential,
            verbose=True
        )

        return crew.kickoff()
