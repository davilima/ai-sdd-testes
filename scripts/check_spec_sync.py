import subprocess
import sys
import os

def get_changed_files():
    """Retorna a lista de arquivos alterados no PR em relação ao branch alvo."""
    try:
        # Tenta comparar com o branch alvo (main por padrão no CI)
        target = os.environ.get('GITHUB_BASE_REF', 'main')
        cmd = ["git", "diff", "--name-only", f"origin/{target}...HEAD"]
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout.splitlines()
    except Exception as e:
        print(f"⚠️ Warning: Could not get diff via git: {e}")
        return []

def check_sync():
    changed_files = get_changed_files()
    if not changed_files:
        print("✅ No changed files detected.")
        return True

    # Mapeia alterações de implementação para nomes de features
    # Exemplo: src/checkout/service.ts -> feature: checkout
    impl_features = set()
    for f in changed_files:
        if f.startswith('src/') and '/' in f[4:]:
            feature_name = f.split('/')[1]
            impl_features.add(feature_name)

    # Verifica quais dessas features tiveram specs alteradas
    spec_changes = set()
    for f in changed_files:
        if f.startswith('.sdd/specs/') and '/' in f[11:]:
            feature_name = f.split('/')[2]
            spec_changes.add(feature_name)

    errors = []
    for feature in impl_features:
        # Se a feature existe em .sdd/specs, ela DEVE ser atualizada se o código for
        if os.path.exists(os.path.join('.sdd/specs', feature)):
            if feature not in spec_changes:
                errors.append(f"❌ Feature '{feature}': Implementation changed in 'src/{feature}/' but no changes found in '.sdd/specs/{feature}/'. Please update your specifications.")

    if errors:
        print("
".join(errors))
        return False

    print("✅ All implementation changes are synced with specifications.")
    return True

if __name__ == "__main__":
    if not check_sync():
        sys.exit(1)
