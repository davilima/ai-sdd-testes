import os
import re
import sys

def validate_ears_syntax(content):
    """
    Verifica se os critérios de aceitação seguem os padrões EARS.
    Padrões: When, If, While, Where, The [system] shall
    """
    ears_patterns = [
        r"(?i)^\s*\d+\.\s+When\s+.*,\s+the\s+.*shall\s+.*",
        r"(?i)^\s*\d+\.\s+If\s+.*,\s+then\s+the\s+.*shall\s+.*",
        r"(?i)^\s*\d+\.\s+While\s+.*,\s+the\s+.*shall\s+.*",
        r"(?i)^\s*\d+\.\s+Where\s+.*,\s+the\s+.*shall\s+.*",
        r"(?i)^\s*\d+\.\s+The\s+.*shall\s+.*"
    ]
    
    # Procura por seções de critérios de aceitação
    if "#### Acceptance Criteria" not in content:
        return []

    lines = content.split('
')
    in_criteria = False
    errors = []

    for i, line in enumerate(lines):
        if "#### Acceptance Criteria" in line:
            in_criteria = True
            continue
        if in_criteria and line.startswith("###"):
            in_criteria = False
            continue
        
        if in_criteria and re.match(r"^\s*\d+\.", line):
            if not any(re.match(pattern, line) for pattern in ears_patterns):
                errors.append(f"Line {i+1}: Requirement does not follow EARS syntax: '{line.strip()}'")
    
    return errors

def validate_mermaid_blocks(content):
    """
    Verifica se os blocos Mermaid possuem um tipo de diagrama válido no início.
    """
    errors = []
    mermaid_blocks = re.findall(r"```mermaid
(.*?)
```", content, re.DOTALL)
    
    valid_types = ["graph", "flowchart", "sequenceDiagram", "classDiagram", "stateDiagram", "erDiagram", "gantt", "pie", "gitGraph"]
    
    for block in mermaid_blocks:
        first_line = block.strip().split('
')[0].split()[0]
        if not any(first_line.startswith(t) for t in valid_types):
            errors.append(f"Invalid Mermaid diagram type: '{first_line}'")
            
    return errors

def main():
    specs_dir = '.sdd/specs'
    all_errors = []

    if not os.path.exists(specs_dir):
        print("✅ No specs found.")
        return

    for root, dirs, files in os.walk(specs_dir):
        for file in files:
            file_path = os.path.join(root, file)
            
            with open(file_path, 'r') as f:
                content = f.read()

            # Valida EARS em requirements.md
            if file == 'requirements.md':
                print(f"🔍 Checking EARS syntax in {file_path}...")
                ears_errors = validate_ears_syntax(content)
                if ears_errors:
                    all_errors.extend([f"{file_path}: {e}" for e in ears_errors])

            # Valida Mermaid em todos os .md
            if file.endswith('.md'):
                print(f"🔍 Validating Mermaid diagrams in {file_path}...")
                mermaid_errors = validate_mermaid_blocks(content)
                if mermaid_errors:
                    all_errors.extend([f"{file_path}: {e}" for e in mermaid_errors])

    if all_errors:
        print("
❌ Validation Failed:")
        print("
".join(all_errors))
        sys.exit(1)
    
    print("
✅ All specifications passed EARS and Mermaid validation!")

if __name__ == "__main__":
    main()
