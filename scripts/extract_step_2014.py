import json

log_path = '/home/fayelle-yvanna/.gemini/antigravity/brain/28e348ce-2bf0-464b-8732-58c82146ffc2/.system_generated/logs/overview.txt'
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index')
            if step == 2014:
                print("Found step 2014!")
                tool_calls = data.get('tool_calls', [])
                for tc in tool_calls:
                    args = tc.get('args', {})
                    print("StartLine:", args.get('StartLine'))
                    print("EndLine:", args.get('EndLine'))
                    target_content = args.get('TargetContent')
                    replacement_content = args.get('ReplacementContent')
                    print("TargetContent Length:", len(target_content) if target_content else 0)
                    print("ReplacementContent Length:", len(replacement_content) if replacement_content else 0)
                    
                    # Save to files so they don't get truncated in stdout
                    with open('/home/fayelle-yvanna/Documents/e-tontine/scripts/step_2014_target.txt', 'w', encoding='utf-8') as out_t:
                        out_t.write(target_content or '')
                    with open('/home/fayelle-yvanna/Documents/e-tontine/scripts/step_2014_replacement.txt', 'w', encoding='utf-8') as out_r:
                        out_r.write(replacement_content or '')
                    print("Saved step_2014_target.txt and step_2014_replacement.txt")
        except Exception as e:
            pass
