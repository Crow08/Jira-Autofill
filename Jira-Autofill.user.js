// ==UserScript==
// @name         DOD/DOR Helper
// @version      0.1.0
// @description  Inject Buttons into Jira to automatically insert DOD or DORs for issues.
// @author       Kevin Hertfelder
// @match        https://levigo-solutions.atlassian.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=atlassian.net
// @grant        none
// ==/UserScript==
const DOD_EPIC = `Definition of DONE Checklist
    - Symposion presentation
    - public release
    - passed on to Marketing and/or Vertrieb (how?)`;
const DOD_STORY = `Definition of DONE Checklist
    - ACs fulfilled
    - final integration test successful
    - no major issues after test
    - Lösungsbeschreibung filled (Customer perspective!)
    - Techn. Lösungbeschreibung filled (internal perspective)
    - customer documentation created/updated? and linked in Lösungsbeschreibung?
    - internal documentation created/updated? and linked in Techn. Lösungsbeschreibung?
Approval
    - result approved by ordering party (typically PO or PM)
    - result approved UX/UI fellow
    - documentation approved by external party (e.g. project developer or project lead)`;
const DOD_TASK_BUG = `Definition of DONE Checklist
    - Code Review:
          - Code is understandable?
          - Code Formatting correct?
          - Coding Standards met?
    - any impact in Helm? → add to documentation
    - Semantic Versioning respected?
    - Breaking Changes? → (Warnung) discuss with PO
    - test cases created and successful? (Unit, Cypress...)
    - change has been deployed to test environments (DO, OO, E-Akte)
    - in case of manual test:
          - test instructions for manual test
          - tested successfully
    - Lösungsbeschreibung filled? (Customer perspective!)
    - Techn. Lösungbeschreibung? (internal perspective)
    - customer documentation created/updated? and linked in Lösungsbeschreibung?
    - internal documentation created/updated? and linked in Techn. Lösungsbeschreibung?`;
const DOD_SUBTASK = `Definition of DONE Checklist
    - Code Review:
    - Code is understandable?
    - Code Formatting correct?
    - Coding Standards met?
    - any impact in Helm? → add to documentation
    - Semantic Versioning respected?
    - Breaking Changes? → (Warnung) discuss with PO
    - test cases created and successful? (Unit, Cypress...)
    - change has been deployed to test environments (DO, OO, E-Akte)
    - in case of manual test:
    - test instructions for manual test
    - tested successfully`;

const DOR_EPIC = `What do we want?

What customer value does this Epic provide? (Outcome)

Strategic fit

Definition of Ready Checklist
    - Kick-Off with PO, DevTeam, (PM?) took place (use Auftragsklärung or similar here)
    - Epic is planned in the roadmap
    - User Stories are ready`;
const DOR_STORY = `What do we want?

What customer value does this feature provide? (Outcome)

Assumptions & Prerequisites

Acceptance Criteria

Definition of READY Checklist
    - Refinement took place?
    - Description updated according to refinement?
    - Estimation finished?
    - (Sub-Tasks of similar size created?)
    - "Component" filled?`;
const DOR_TASK = `Technical Description

What customer value does this provide? (Outcome)

Definition of READY Checklist
    - Refinement took place?
    - Description has been updated according to refinement?
    - Estimation finished?
    - (Sub-Tasks of similar size created?)
    - "Component" filled?`;
const DOR_BUG = `Wrong/Expected behaviour

Impact/Severity

How to reproduce

Affected:
    - Environment:
    - Product:
    - Version:

Definition of READY Checklist
    - "Affected Version" filled?
    - Component filled?`;
const DOR_SUBTASK = `Technical Description`;

const ISSUE_DESCRIPTION_EDITOR_SELECTOR = "#ak-editor-textarea > p";

const CREATE_ISSUE_MODAL_SELECTOR = '[data-testid="issue-create.ui.modal.modal-wrapper.modal"]';
const CREATE_ISSUE_MODAL_DESCRIPTION_CONTAINER_SELECTOR = '#description-container';
const CREATE_ISSUE_MODAL_DESCRIPTION_LABEL_SELECTOR = '#description-field-label';

const CREATE_ISSUE_MODAL_ISSUE_TYPE_SELECTOR = '#issue-create\\.ui\\.modal\\.create-form\\.type-picker\\.issue-type-select';
const CREATE_ISSUE_MODAL_DROPDOWN_LABEL_SELECTOR = '[data-testid="issue-field-select-base.ui.format-option-label.c-label"]';

const ISSUE_PAGE_DESCRIPTION_CONTAINER_SELECTOR = '[data-testid="issue.views.field.rich-text.editor-container"]';
const ISSUE_PAGE_DESCRIPTION_LABEL_SELECTOR = '[data-testid="issue.views.issue-base.common.description.label"]';

const ISSUE_PAGE_ISSUE_TYPE_ICON = '[data-testid="issue.views.issue-base.foundation.change-issue-type.button"] > span > img';

let issueType = "Story";

const dodButton = document.createElement("button");
dodButton.textContent = 'DoD';
dodButton.style = "margin-left: 8px;";
dodButton.addEventListener('click', () => {
    const modal = document.querySelector(CREATE_ISSUE_MODAL_SELECTOR);
    getIssueType(undefined);
    injectText(undefined, true);
});

const dorButton = document.createElement("button");
dorButton.textContent = 'DoR';
dorButton.style = "margin-left: 8px;";
dorButton.addEventListener('click', () => {
    const modal = document.querySelector(CREATE_ISSUE_MODAL_SELECTOR);
    getIssueType(undefined);
    injectText(undefined, false);
});

const modalDoDButton = document.createElement("button");
modalDoDButton.textContent = 'DoD';
modalDoDButton.style = "margin-left: 8px;";
modalDoDButton.addEventListener('click', () => {
    const modal = document.querySelector(CREATE_ISSUE_MODAL_SELECTOR);
    getIssueType(modal);
    injectText(modal, true);
});

const modalDoRButton = document.createElement("button");
modalDoRButton.textContent = 'DoR';
modalDoRButton.style = "margin-left: 8px;";
modalDoRButton.addEventListener('click', () => {
    const modal = document.querySelector(CREATE_ISSUE_MODAL_SELECTOR);
    getIssueType(modal);
    injectText(modal, false);
});

const getDoDText = () => {
    switch(issueType) {
        case "Epic":
            return DOD_EPIC;
        case "Story":
            return DOD_STORY;
        case "Task":
        case "Bug":
            return DOD_TASK_BUG;
        case "Sub-task":
            return DOD_SUBTASK;
        default:
            return "unknown issue type";
    }
}
const getDoRText = () => {
    switch(issueType) {
        case "Epic":
            return DOR_EPIC;
        case "Story":
            return DOR_STORY;
        case "Task":
            return DOR_TASK;
        case "Bug":
            return DOR_BUG;
        case "Sub-task":
            return DOD_SUBTASK;
        default:
            return "unknown issue type";
    }
}

const getIssueType = (modal) => {
    if(modal) {
        const issueTypeField = modal.querySelector(CREATE_ISSUE_MODAL_ISSUE_TYPE_SELECTOR);
        if(!!issueTypeField) {
            const dropdown = issueTypeField.querySelector(CREATE_ISSUE_MODAL_DROPDOWN_LABEL_SELECTOR);
            if(!!dropdown) {
                issueType = dropdown.innerText;
            }
        }
    } else {
        const icon = document.querySelector(ISSUE_PAGE_ISSUE_TYPE_ICON);
        if(!!icon) {
            issueType = icon.alt;
        }
    }
}

const injectButton = (modal) => {
    if(modal) {
        if(document.body.contains(modalDoDButton)) {
            return;
        }
        const description = modal.querySelector(CREATE_ISSUE_MODAL_DESCRIPTION_LABEL_SELECTOR);
        if(!!description) {
            description.after(modalDoDButton);
            description.after(modalDoRButton);
        }
    } else {
        if(document.body.contains(dodButton)) {
            return;
        }
        const descriptionContainer = document.querySelector(ISSUE_PAGE_DESCRIPTION_CONTAINER_SELECTOR);
        if(descriptionContainer) {
            const descriptionEditor = descriptionContainer.querySelector(ISSUE_DESCRIPTION_EDITOR_SELECTOR)
            if(descriptionEditor) {
                const description = document.querySelector(ISSUE_PAGE_DESCRIPTION_LABEL_SELECTOR);
                if(description) {
                    description.after(dodButton);
                    description.after(dorButton);
                }
            }
        }
    }
};

const injectText = (modal, isDoD) => {
    if(modal) {
        const description = modal.querySelector(CREATE_ISSUE_MODAL_DESCRIPTION_CONTAINER_SELECTOR);
        if(!!description) {
            const editor = description.querySelector(ISSUE_DESCRIPTION_EDITOR_SELECTOR);
            editor.innerText = isDoD ? getDoDText(isDoD) : getDoRText(isDoD) ;
        }
    } else {
        const description = document.querySelector(ISSUE_PAGE_DESCRIPTION_CONTAINER_SELECTOR);
        if(!!description) {
            const editor = description.querySelector(ISSUE_DESCRIPTION_EDITOR_SELECTOR);
            editor.innerText = isDoD ? getDoDText(isDoD) : getDoRText(isDoD) ;
        }
    }
}

(function() {
    // Setup page observer.
    this.observer = new MutationObserver(() => {
        const modal = document.querySelector(CREATE_ISSUE_MODAL_SELECTOR);
        if(!!modal) {
            injectButton(modal);
        }
        injectButton();
    });
    this.observer.observe(document.querySelector("body"), {"childList": true, "subtree": true});
})();
