// From https://stackoverflow.com/a/47203743
if (Uint8Array && window.crypto && window.crypto.getRandomValues) {
    Array.prototype.shuffle = function() {
        var n = this.length;
    
        // If array has <2 items, there is nothing to do
        if (n < 2) return this;
        // Reject arrays with >= 2**31 items
        if (n > 0x7fffffff) throw "ArrayTooLong";
    
        var i, j, r=n*2, tmp, mask;
        // Fetch (2*length) random values
        var rnd_words = new Uint32Array(r);
        // Create a mask to filter these values
        for (i=n, mask=0; i; i>>=1) mask = (mask << 1) | 1;
    
        // Perform Fisher-Yates shuffle
        for (i=n-1; i>0; i--) {
            if ((i & (i+1)) == 0) mask >>= 1;
            do {
                if (r == n*2) {
                    // Refresh random values if all used up
                    window.crypto.getRandomValues(rnd_words);
                    r = 0;
                }
                j = rnd_words[r++] & mask;
            } while (j > i);
            tmp = this[i];
            this[i] = this[j];
            this[j] = tmp;
        }
        return this;
    }
} else throw "Unsupported";

const names = [];


class Names {
    names = [];
    observers = [];

    constructor(names) {
        this.names = names || [];
    }

    add(name) {
        this.names.push(name);
        this.updateListeners();
    }

    remove(i) {
        this.names.splice(i, 1);
        this.updateListeners(this.names);
    }

    addObserver(observer) {
        this.observers.push(observer);
        if (this.names && this.names.length !== 0) {
            this.updateListeners();
        }
    }

    updateListeners() {
        this.observers.forEach((obs) => {
            obs.update(this.names)
        });
    }

    shuffle() {
        for (let i = this.names.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.names[i], this.names[j]] = [this.names[j], this.names[i]];
        }
        
        this.updateListeners();
    }

    cryptoShuffle() {
        this.names.shuffle()
        this.updateListeners();
    }
}

class NameListElement {
    el;
    names;

    constructor(names) {
        this.names = names;
        this.el = 'name-list';
    }

    reselectElement() {
        return document.getElementById(this.el);
    }

    update(names) {
        const nameHtml = this.names.names.map((name, i) => `<li>${name} (<button class="remove-button" data-name="${name}" data-index="${i}">remove</button>)</li>`).join('');
        this.reselectElement().innerHTML = nameHtml;
        this.addRemoveListeners();
    }

    onClickRemove(e) {
        this.names.remove(e.target.dataset['index']);
    }

    addRemoveListeners() {
        const removeButtons = document.getElementsByClassName('remove-button');
        for (let btn of removeButtons) {
            btn.addEventListener('click', this.onClickRemove.bind(this));
        }
    }
}

class CopyAreaElement {
    el;
    names;

    constructor(names) {
        this.names = names;
        this.el = 'copy-area'
    }

    reselectElement() {
        return document.getElementById(this.el);
    }

    update(names) {
        const formattedNames = this.names.names.map((name, i) => `${name}\n`).join('');
        this.reselectElement().value = formattedNames;
    }

    copy() {
        this.reselectElement().select();
        document.execCommand('copy');
    }
}

class UrlParams {
    update(names) {
        const commaNames = names.join(',');
        window.history.pushState({names}, '', `?names=${commaNames}`);
    }

    toArray() {
        const urlSearchParams = new URLSearchParams(window.location.search)
        let names;
        for (let [key, value] of urlSearchParams) {
            if (key === 'names') {
                names = value.split(',');
            }
        }

        return names;
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new UrlParams();
    const names = new Names(urlParams.toArray());
    const nameList = new NameListElement(names);
    const copyArea = new CopyAreaElement(names);
    names.addObserver(nameList);
    names.addObserver(urlParams);
    names.addObserver(copyArea)

    const nameForm = document.getElementById('name-form');
    nameForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameField = document.getElementById('name');
        const value = nameField.value;
        if (value !== '') {
            nameField.value = '';
            nameField.focus();
            names.add(value);
        }
    });

    const shuffleButton = document.getElementById('shuffle-button');
    shuffleButton.addEventListener('click', () => {
        names.cryptoShuffle();
    });

    names.cryptoShuffle();

    const copyButton = document.getElementById('copy-button');
    copyButton.addEventListener('click', () => {
       copyArea.copy();
    });
});
