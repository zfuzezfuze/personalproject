
import os
import psycopg
from psycopg.rows import dict_row
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ]
    }
})


@app.route("/api/tasks", methods=["GET"])
def get_tasks():

    # Connect to PostgreSQL
    with psycopg.connect(
        os.environ["DATABASE_URL"],
        row_factory=dict_row
    ) as conn:

        # Retrieve tasks from the database
        with conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, user_id, title, due_date, completed FROM tasks"
            )

            tasks = cursor.fetchall()

    # Convert database dates into JSON-friendly strings
    for task in tasks:
        task["due_date"] = task["due_date"].isoformat()

    return jsonify(tasks)


if __name__ == "__main__":
    app.run(port=5001, debug=True)
