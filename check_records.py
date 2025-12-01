from database import get_mood_records

records = get_mood_records()
print(f'Total records: {len(records)}')
for r in records[:3]:
    print(f'  - {r["emotion"]} at {r["timestamp"]}')
