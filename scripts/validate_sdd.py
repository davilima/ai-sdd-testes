import os
import json
import sys

def validate_specs():
    specs_dir = '.sdd/specs'
    if not os.path.exists(specs_dir):
        print("✅ No specs directory found. Skipping validation.")
        return True

    errors = []
    for feature in os.listdir(specs_dir):
        feature_path = os.path.join(specs_dir, feature)
        if not os.path.isdir(feature_path):
            continue

        print(f"🔍 Validating feature: {feature}")
        
        # Check for spec.json
        spec_json_path = os.path.join(feature_path, 'spec.json')
        if not os.path.exists(spec_json_path):
            errors.append(f"❌ {feature}: Missing spec.json")
            continue

        try:
            with open(spec_json_path, 'r') as f:
                spec_data = json.load(f)
        except Exception as e:
            errors.append(f"❌ {feature}: Invalid spec.json format - {str(e)}")
            continue

        # Check for mandatory files based on approvals
        approvals = spec_data.get('approvals', {})
        
        if approvals.get('requirements', {}).get('generated'):
            if not os.path.exists(os.path.join(feature_path, 'requirements.md')):
                errors.append(f"❌ {feature}: Requirements generated but requirements.md is missing")

        if approvals.get('design', {}).get('generated'):
            if not os.path.exists(os.path.join(feature_path, 'design.md')):
                errors.append(f"❌ {feature}: Design generated but design.md is missing")

        if approvals.get('tasks', {}).get('generated'):
            if not os.path.exists(os.path.join(feature_path, 'tasks.md')):
                errors.append(f"❌ {feature}: Tasks generated but tasks.md is missing")

    if errors:
        print("\n".join(errors))
        return False
    
    print("✅ All specifications are valid!")
    return True

if __name__ == "__main__":
    if not validate_specs():
        sys.exit(1)
