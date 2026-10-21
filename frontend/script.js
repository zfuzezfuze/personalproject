async function loadTasks() {
    const response = await fetch("http://localhost:5001/api/tasks");

    const tasks = await response.json();

    console.log(tasks);
}




