"use strict";

const STORAGE_KEY = "student-bonafide-demo-requests";
const requestForm = document.querySelector("#request-form");
const trackForm = document.querySelector("#track-form");
const reviewList = document.querySelector("#review-list");
const certificateArea = document.querySelector("#certificate-area");

function showFeedback(element, message, isError = false) {
  element.replaceChildren(document.createTextNode(message));
  element.classList.toggle("error", isError);
  element.hidden = false;
}

function loadRequests() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === null) return [];

  const requests = JSON.parse(saved);
  if (!Array.isArray(requests)) {
    throw new Error("Saved demo data has an unexpected format.");
  }
  return requests;
}

function saveRequests(requests) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function makeApplicationCode() {
  const randomPart = window.crypto?.getRandomValues
    ? Array.from(window.crypto.getRandomValues(new Uint32Array(1)))[0].toString(16).toUpperCase().padStart(8, "0").slice(-8)
    : Math.random().toString(16).slice(2, 10).toUpperCase().padEnd(8, "0");
  return `BNF-${randomPart}`;
}

function makeReviewItem(request) {
  const item = document.createElement("article");
  item.className = "review-item";

  const details = document.createElement("div");
  const name = document.createElement("h3");
  name.textContent = request.student_name;
  const code = document.createElement("p");
  code.textContent = `${request.application_code} · ${request.email}`;
  const course = document.createElement("p");
  course.textContent = `${request.department} · ${request.year_of_study} · ${request.purpose}`;
  const status = document.createElement("span");
  status.className = `status-label ${request.status.toLowerCase()}`;
  status.textContent = request.status;
  details.append(name, code, course, status);

  const actions = document.createElement("div");
  actions.className = "review-actions";
  if (request.status === "Pending") {
    for (const [label, nextStatus, className] of [
      ["Approve", "Approved", "approve-button"],
      ["Reject", "Rejected", "reject-button"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.applicationCode = request.application_code;
      button.dataset.status = nextStatus;
      button.textContent = label;
      actions.append(button);
    }
  }
  item.append(details, actions);
  return item;
}

function renderReviewList(requests) {
  reviewList.replaceChildren();
  if (requests.length === 0) {
    const empty = document.createElement("p");
    empty.className = "review-empty";
    empty.textContent = "No demo requests yet. Submit the form above to add one.";
    reviewList.append(empty);
    return;
  }
  requests.slice().reverse().forEach((request) => reviewList.append(makeReviewItem(request)));
}

function showCertificate(request) {
  const certificateFields = {
    "certificate-code": request.application_code,
    "certificate-name": request.student_name,
    "certificate-register": request.register_number,
    "certificate-year": request.year_of_study,
    "certificate-department": request.department,
    "certificate-purpose": request.purpose,
    "certificate-date": new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date()),
  };
  for (const [id, value] of Object.entries(certificateFields)) {
    document.getElementById(id).textContent = value;
  }
  certificateArea.hidden = false;
}

requestForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#request-feedback");
  const formData = new FormData(requestForm);
  const newRequest = Object.fromEntries(formData.entries());
  newRequest.email = String(newRequest.email).trim().toLowerCase();
  newRequest.application_code = makeApplicationCode();
  newRequest.status = "Pending";
  newRequest.submitted_at = new Date().toISOString();

  try {
    const requests = loadRequests();
    requests.push(newRequest);
    saveRequests(requests);
    renderReviewList(requests);
    document.querySelector("#application-code").value = newRequest.application_code;
    document.querySelector("#track-email").value = newRequest.email;
    requestForm.reset();
    showFeedback(feedback, `Request saved in this browser. Your application code is ${newRequest.application_code}. Use it with your email to check status.`);
  } catch (error) {
    console.error("Could not save the demo request.", error);
    showFeedback(feedback, "Could not save this request in browser storage. Check your browser storage settings and try again.", true);
  }
});

trackForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#track-feedback");
  const code = document.querySelector("#application-code").value.trim().toUpperCase();
  const email = document.querySelector("#track-email").value.trim().toLowerCase();

  try {
    const match = loadRequests().find((request) =>
      request.application_code === code && request.email === email
    );
    if (!match) {
      showFeedback(feedback, "No matching request found in this browser. Check the code and email.", true);
      return;
    }

    feedback.replaceChildren();
    const summary = document.createElement("span");
    summary.textContent = `${match.student_name} · ${match.application_code}`;
    const detail = document.createElement("div");
    detail.className = "status-detail";
    const status = document.createElement("span");
    status.textContent = "Status: ";
    const statusValue = document.createElement("b");
    statusValue.textContent = match.status;
    status.append(statusValue);
    const purpose = document.createElement("span");
    purpose.textContent = `Purpose: ${match.purpose}`;
    detail.append(status, purpose);
    feedback.append(summary, detail);
    if (match.status === "Approved") {
      showCertificate(match);
      const printButton = document.createElement("button");
      printButton.type = "button";
      printButton.className = "button button-primary certificate-link";
      printButton.textContent = "View / print certificate";
      printButton.addEventListener("click", () => {
        certificateArea.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      feedback.append(printButton);
    } else {
      certificateArea.hidden = true;
    }
    feedback.classList.remove("error");
    feedback.hidden = false;
  } catch (error) {
    console.error("Could not read the demo request.", error);
    showFeedback(feedback, "Could not read demo requests from browser storage.", true);
  }
});

document.querySelector("#print-certificate").addEventListener("click", () => window.print());

reviewList.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-application-code]");
  if (!button) return;

  try {
    const requests = loadRequests();
    const selected = requests.find((request) => request.application_code === button.dataset.applicationCode);
    if (!selected || !["Approved", "Rejected"].includes(button.dataset.status)) {
      throw new Error("The selected demo request or status is invalid.");
    }
    selected.status = button.dataset.status;
    saveRequests(requests);
    renderReviewList(requests);
    if (selected.status === "Approved") {
      document.querySelector("#application-code").value = selected.application_code;
      document.querySelector("#track-email").value = selected.email;
      trackForm.requestSubmit();
      certificateArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) {
    console.error("Could not update the demo request.", error);
    window.alert("Could not update the request in browser storage.");
  }
});

try {
  renderReviewList(loadRequests());
} catch (error) {
  console.error("Could not load saved demo requests.", error);
  reviewList.textContent = "Could not load saved requests from browser storage.";
}
