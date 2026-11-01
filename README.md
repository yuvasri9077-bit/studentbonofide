# Student Bonafide Management System

A browser-only front-end demo for a student bonafide certificate portal.

## Project structure

- `templates/index.html` — portal page.
- `static/style.css` — page styles.
- `static/script.js` — browser-side demo behavior.

## Open the project

Open `templates/index.html` in a web browser. It loads its styles and script from the `static` folder.

Submit a request, track it with its generated application code and email, and use the demo review section to change its status. Approving a request displays the demo certificate, which can be printed or saved as a PDF. Requests are stored in the browser's local storage, so use the same browser to see them again.

## Demo limitation

This project does not have a database or server-side request handling. JavaScript and browser local storage simulate request submission and review on one device only. This is not secure storage, and the demo review controls are not real administrator authentication. It does not send requests to a college or issue official certificates.

Update the sample college name and the form options in `templates/index.html` to match your institution.
