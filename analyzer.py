import os
import json
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

# Initialize Gemini 1.5 Flash for fast, free processing
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.1,
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

def chunk_commits(commits, chunk_size=50):
    """Splits a massive list of commits into manageable batches."""
    for i in range(0, len(commits), chunk_size):
        yield commits[i:i + chunk_size]

def run_map_pass(commit_chunks):
    """
    Step 1 (Map): Summarize small historical windows of code changes.
    """
    print(f"Starting Map Pass: Summarizing {len(commit_chunks)} individual code strata...")
    
    map_prompt = ChatPromptTemplate.from_template(
        "You are a technical code archaeologist analyzer. Analyze this chronological block of git commits "
        "and summarize the key architectural focus, directory/feature updates, and any technical debt introduced. "
        "Keep it concise and highly technical.\n\n"
        "Commits JSON:\n{chunk_data}\n\n"
        "Summary:"
    )
    
    # Create a quick chain
    map_chain = map_prompt | llm
    chunk_summaries = []
    
    for idx, chunk in enumerate(commit_chunks):
        # Serialize the chunk metadata to text for the LLM
        chunk_text = json.dumps(chunk, indent=2)
        response = map_chain.invoke({"chunk_data": chunk_text})
        
        print(f" -> Processed layer {idx + 1}/{len(commit_chunks)}")
        chunk_summaries.append(response.content)
        
    return chunk_summaries

def run_reduce_pass(summaries):
    """
    Step 2 (Reduce): Synthesize all localized chunk summaries into macro Eras.
    """
    print("Starting Reduce Pass: Synthesizing historical macro eras...")
    
    reduce_prompt = ChatPromptTemplate.from_template(
        "You are a master code archaeologist. You are given a sequential series of localized technical "
        "summaries outlining the evolution of a software repository over time. Your job is to analyze "
        "these records and synthesize the entire history into 3 to 6 distinct, sequential historical 'Eras'.\n\n"
        "Enforce these strict formatting constraints:\n"
        "1. Give each Era a creative, highly specific title (e.g., 'The Monolith Foundation', 'The Great TypeScript Migration').\n"
        "2. Provide an accurate approximate chronological order.\n"
        "3. Provide a compelling, insightful 2-paragraph narrative story for each Era explaining *why* decisions were made.\n"
        "4. Output strictly valid JSON that follows the provided schema without any markdown wrapping blocks.\n\n"
        "Localized Summaries:\n{combined_summaries}\n\n"
        "Output Schema Template:\n"
        "[\n"
        "  {{\n"
        "    \"era_title\": \"Name of the Era\",\n"
        "    \"dominant_contributors\": [\"Author Name\"],\n"
        "    \"narrative\": \"2-paragraph engineering history story...\"\n"
        "  }}\n"
        "]"
    )
    
    # We use a JSON parser to cleanly turn the string response straight into python data structures
    reduce_chain = reduce_prompt | llm | JsonOutputParser()
    
    final_eras = reduce_chain.invoke({"combined_summaries": "\n\n--- Next Layer Summary ---\n\n".join(summaries)})
    return final_eras

def run_survival_guide_pass(eras):
    """
    Step 3: Generate a New Hire Survival Guide based on the synthesized eras.
    """
    print("Starting Survival Guide Pass: Writing the onboarding artifact...")
    
    guide_prompt = ChatPromptTemplate.from_template(
        "You are a master staff engineer writing a 'New Hire Survival Guide' for a software repository. "
        "You are given the chronological history of the codebase broken down into 'Eras'.\n\n"
        "Your task is to synthesize this history into a highly technical, witty, and practical Markdown guide. "
        "Include the following sections:\n"
        "1. **Welcome to the Dig Site**: A brief, engaging introduction.\n"
        "2. **The Tech Stack Evolution**: How the architecture changed over time.\n"
        "3. **Known Tech Debt & Dragons**: Areas of the code that are notoriously complex or legacy.\n"
        "4. **Where to Start**: Actionable advice for a new engineer making their first commit.\n\n"
        "Eras JSON Data:\n{eras_data}\n\n"
        "Output strictly valid Markdown without any wrapper JSON or code block formatting like ```markdown."
    )
    
    guide_chain = guide_prompt | llm
    
    # We pass the JSON string of eras directly to the LLM
    response = guide_chain.invoke({"eras_data": json.dumps(eras, indent=2)})
    return response.content

def analyze_codebase_history(extracted_json_path):
    """
    Main orchestration loop for Phase 2.
    """
    # 1. Load the data extracted from Phase 1
    with open(extracted_json_path, 'r') as f:
        data = json.load(f)
        
    if isinstance(data, dict) and "commits" in data:
        all_commits = data["commits"]
        file_stats = data.get("file_stats", {})
    else:
        all_commits = data
        file_stats = {}
    
    # Reverse so we analyze from oldest commit to newest commit (chronological alignment)
    all_commits.reverse()
    
    # 2. Slice into chunks of 50
    chunks = list(chunk_commits(all_commits, chunk_size=50))
    
    # 3. Map Pass
    chunk_summaries = run_map_pass(chunks)
    
    # 4. Reduce Pass
    historical_eras = run_reduce_pass(chunk_summaries)
    
    # 5. Survival Guide Pass
    survival_guide = run_survival_guide_pass(historical_eras)
    
    return {
        "eras": historical_eras,
        "survival_guide": survival_guide,
        "file_stats": file_stats
    }

if __name__ == "__main__":
    # Point this to a test file generated from Phase 1 data
    # (For a quick local test, mock an 'extracted_commits.json' or link it to your dynamic output)
    import sys
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        print("Please provide a path to an extracted commits JSON file.")
        sys.exit(1)
        
    eras_report = analyze_codebase_history(input_file)
    
    # Save the structured artifact output
    output_filename = "eras.json"
    with open(output_filename, "w") as f:
        json.dump(eras_report, f, indent=2)
        
    print(f"\n🎉 Archaeology complete! Historical eras saved to {output_filename}")