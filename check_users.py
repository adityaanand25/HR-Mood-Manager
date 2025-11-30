import database

print("=== Available Users ===")
users = database.get_all_users()
for u in users:
    print(f"User ID: {u['user_id']} | Role: {u['role']} | Name: {u['full_name']}")
