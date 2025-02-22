/* 

  Old version of form.js where validation is handled in form.js instead of by FormManager.

*/

import FormPage from '/init/FormPage.js';

let pageNum = null; // pageNum starts at 1
let currentPageEl = document.getElementById('page-1');
let savedInputs = {};
let lastInvalidInput = null;

handleValidatePattern();
handlePaging();

function handleValidatePattern() {
    const inputs = getAllInputs();
    inputs.forEach((input)=> {
        let lastValidValue = '';
        input.addEventListener('input', function() { // for hard invalids (not blank), prevent user from changing input to invalid input
            if (!this.checkValidity()) { // doesn't match pattern
                setWarning(this, `Doesn't match pattern.`);
            }   
            else if (this.maxLength && this.value.length > this.maxLength) { // doesn't match maxlength
                setWarning(this, `Enter a ${this.getAttribute('aria-label')} less than ${this.maxLength}`);
            }
            else { // skip invalid, update last valid value
                lastValidValue = this.value;
                clearWarning();
                return;
            }

            this.value = lastValidValue; // for invalid, prevent user from changing input to invalid input
        })
    })
}

function getAllInputs() {
    return document.querySelectorAll('input, select');
}

function getInputs() {
    if (!currentPageEl) {
        console.error('current page element not initialized');
    }
    return currentPageEl.querySelectorAll('input, select');
}

function handlePaging() {
    const pages = [
        new FormPage('name', 'Create a Google Account', 'Enter a name'),
        new FormPage('birthdaygender', 'Basic information', 'Enter a birthday and gender')
    ];

    // On new form or reload. REMOVED in new version.

    const queryString = window.location.search;
    if (queryString) {
        const urlParams = new URLSearchParams(queryString);
        pageNum = urlParams.get('page');
        if (pageNum < 1 || pageNum > pages.length) { // invalid page number
            // hide initialized page and description
            currentPageEl.style.display = 'none';
            const errorEl = document.getElementById('error');
            const descEl = document.getElementById('desc');
            descEl.style.display = 'none';

            // show error message
            errorEl.textContent = `Error, please re-complete the form. Click "Next" to proceed.`;
            errorEl.style.display = 'block';

            // reload form on clicking next button
            handleNextError();

            return; // don't do anything later in handlePaging()
        }
        else {
            displayNewPage(pages, pageNum);
        }
        
    }
    else { // newly entered form, add params to url
        pageNum = 1;
        updatePageURL(pages, 1);
    }

    // page changes

    window.addEventListener('popstate', (e)=> {
        let newPageNum = e.state.page;
        if (!newPageNum) {
            console.error('Page number not found in state');
        }
        pageNum = newPageNum;

        clearWarning();
        displayNewPage(pages, pageNum);
    })

    handleNext(pages);
}

function setWarning(input, msg) {
    lastInvalidInput = input;

    const warningContainer = document.querySelector('.warning');
    const warningText = document.querySelector('.warning-text');
    warningText.textContent = msg;
    warningContainer.style.display = 'block';
    input.setAttribute('aria-invalid', true);
    input.focus();
}

function clearWarning() {
    const warningContainer = document.querySelector('.warning');
    const warningText = document.querySelector('.warning-text');
    warningText.textContent = '';
    warningContainer.style.display = 'none';
}

function handleNextError() {
    const nextButton = document.getElementById('next');
    const formURL = window.location.href.split('?')[0]; // form url without params
    nextButton.addEventListener('click', ()=> {
        window.location.href = formURL;
    })
}

function handleNext(pages) {
    const nextButton = document.getElementById('next');

    nextButton.addEventListener('click', ()=> {
        if (!currentPageEl) {
            currentPageEl = document.getElementById(`page-${pageNum}`);
        }

        const inputs = getInputs();
        if (!inputs) {
            console.error('No inputs!');
        }
        const res = saveInputsIfValid(inputs);
        if (res) { // invalid input
            // validate last invalid input if exists 
            if (lastInvalidInput && !isInvalid(lastInvalidInput)) clearLastInvalidInput();

            // invalidate first invalid input
            setWarning(res, `Enter ${res.getAttribute('aria-label')}`);
        }
        else { // move to next page
            console.log('moving on!');
            updatePageURL(pages, ++pageNum);
            displayNewPage(pages, pageNum);
        }
    })
}

function updatePageURL(pages, pageNum) {
    const state = { page: pageNum };
    const name = pages[pageNum - 1].name; // since pageNum starts at 1
    history.pushState(state, '', `?${name}&page=${pageNum}`);
}

function displayNewPage(pages, pageNum) {
    // hide content until done loading
    const contentEl = document.getElementById('content');
    contentEl.style.display = 'none';

    // hide last page
    const lastPageEl = currentPageEl;
    if (lastPageEl) { 
        lastPageEl.style.display = 'none';
    }
    else { // on reload, currentPageEl will initially be null
        const firstPageEl = document.getElementById('page-1');
        firstPageEl.style.display = 'none';
    }

    // update instructions
    const pageInfo = pages[pageNum - 1];
    document.getElementById('title').textContent = pageInfo.title;
    document.getElementById('desc').textContent = pageInfo.desc;

    // clear last invalid input since it may be on new page
    clearLastInvalidInput();

    // show current page
    currentPageEl = document.getElementById(`page-${pageNum}`);
    
    if (!currentPageEl) {
        console.error(`Page element of ${pageNum} index not found!`);
    }

    currentPageEl.style.display = 'block';

    // show content
    contentEl.style.display = 'block';
}

function loadSavedInputs() { /* This isn't needed since form saves and clears by session. (Either by reload or new URL) */
    if (Object.keys(savedInputs).length === 0) { // no saved inputs
        return;
    }
    if (!currentPageEl) {
        console.error('No current page element set');
    }
    const inputs = getInputs();
    inputs.forEach((input)=> {
        const label = input.getAttribute('aria-label');
        if (label in savedInputs) {
            input.value = savedInputs[label];
        }
    });
}

function saveInputsIfValid(inputs) {
    for (let i = 0; i < inputs.length; i++) {
        if (isInvalid(inputs[i])) {
            return inputs[i];
        }
        else {
            savedInputs[inputs[i].getAttribute('aria-label')] = inputs[i].value.trim();
        }
    }
    return null;
}

function isInvalid(input) {
    const ariaRequired = input.getAttribute('aria-required');
    if (!ariaRequired || ariaRequired === 'false') {
        return false;
    }
    else {
        return input.value.trim() === '';
    }
}

function clearLastInvalidInput() {
    if (lastInvalidInput) lastInvalidInput.setAttribute('aria-invalid', false);
    clearWarning();
}
