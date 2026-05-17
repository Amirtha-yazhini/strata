import json
import re
from datetime import datetime
from pydriller import Repository

# Technical debt keyword tracking regex [cite: 24]
DEBT_KEYWORDS = re.compile(r'\b(hacky|workaround|todo|fix later|temporary|spaghetti)\b', re.IGNORECASE)

# Bot and automation noise filtering patterns [cite: 20]
BOT_PATTERNS = [
    r'dependabot\[bot\]',
    r'semantic-release',
    r'github-actions',
    r'greenkeeper',
    r'renovate'
]
BOT_REGEX = re.compile('|'.join(BOT_PATTERNS), re.IGNORECASE)

def should_filter_commit(commit) -> bool:
    """
    Returns True if the commit is noise (bots, pure formatting, etc.) and should be dropped[cite: 19].
    """
    # 1. Filter out known automation bots by author name or email [cite: 20]
    author_identity = f"{commit.author.name} {commit.author.email}"
    if BOT_REGEX.search(author_identity):
        return True
        
    # 2. Filter out common automated bot commit message styles [cite: 20]
    if "chore(deps):" in commit.msg or "Merge pull request" in commit.msg:
        return True

    # 3. Filter out trivial whitespace/formatting commits [cite: 21]
    # (If a commit has modifications, but 0 lines were actually added or removed, it's formatting noise) [cite: 21, 23]
    if commit.insertions == 0 and commit.deletions == 0:
        return True

    return False

def analyze_commit_sentiment(message: str) -> list:
    """
    Scans the commit message for code smells and technical debt indicators[cite: 24, 33].
    """
    return DEBT_KEYWORDS.findall(message)

def extract_repository_history(repo_url: str, max_commits: int = 1000):
    """
    Clones/opens a repository and streams out structured, high-signal commit data[cite: 16, 63, 70].
    """
    cleaned_commits = []
    
    print(f"Excavating {repo_url}... [cite: 63]")
    
    # Using PyDriller's Repository mining engine [cite: 60, 63]
    # We pass a commit limit to keep local execution fast during development [cite: 17, 66]
    repo_miner = Repository(repo_url, order='reverse') 
    
    count = 0
    for commit in repo_miner.traverse_commits():
        if count >= max_commits:
            break
            
        # Run noise filtering heuristics [cite: 19]
        if should_filter_commit(commit):
            continue
            
        # Extract precise commit metrics [cite: 22]
        debt_signals = analyze_commit_sentiment(commit.msg)
        
        commit_data = {
            "sha": commit.hash,
            "author": commit.author.name,
            "email": commit.author.email,
            "timestamp": commit.author_date.isoformat(),
            "message": commit.msg.strip().split('\n')[0], # Take the first summary line [cite: 69]
            "lines_added": commit.insertions,
            "lines_removed": commit.deletions,
            "files_changed_count": commit.files,
            "has_debt_signals": len(debt_signals) > 0,
            "debt_keywords": list(set([kw.lower() for kw in debt_signals]))
        }
        
        cleaned_commits.append(commit_data)
        count += 1

    return cleaned_commits

if __name__ == "__main__":
    # Test on a small, fast public repo [cite: 66]
    # Feel free to change this to any small target repo [cite: 16, 66]
    TARGET_REPO = "https://github.com/psf/requests-html" 
    
    history_json = extract_repository_history(TARGET_REPO, max_commits=200)
    
    # Print the clean structured JSON data to the terminal 
    print(json.dumps(history_json, indent=2))