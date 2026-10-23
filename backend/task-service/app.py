
import os
import psycopg
from psycopg.rows import dict_row
from flask import Flask, jsonify
from flask_cors import CORS
from flask import Flask, jsonify, request

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

    # Read the date sent by the frontend
    selected_date = request.args.get("date")

    # Connect to PostgreSQL
    with psycopg.connect(
        "postgresql://studytrack:devpassword@localhost:5433/studytrack",
        row_factory=dict_row
    ) as conn:

        # Create the database cursor
        with conn.cursor() as cursor:

            if selected_date:
                # Retrieve tasks for the selected date
                cursor.execute(
                    """
                    SELECT id, user_id, title, due_date, completed
                    FROM tasks
                    WHERE due_date = %s
                    """,
                    (selected_date,)
                )
            else:
                # Retrieve all tasks
                cursor.execute(
                    """
                    SELECT id, user_id, title, due_date, completed
                    FROM tasks
                    """
                )

            # Fetch the results of whichever query ran
            tasks = cursor.fetchall()

    # Convert database dates into JSON-friendly strings
    for task in tasks:
        task["due_date"] = task["due_date"].isoformat()

    return jsonify(tasks)

if __name__ == "__main__":
    app.run(port=5001, debug=True)
