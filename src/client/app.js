const InfinityArcadeAPI = require('./api');
const InfinityArcadeGame = require('./game');
const UserInterface = require('./ui');
const Radio = require("./radio");
const { getCookie, setCookie } = require('./utils');

class InfinityArcade {
    constructor() {
        this.api = new InfinityArcadeAPI();
        this.ui = new UserInterface();
        this.radio = new Radio(this.api);
        this.game = null;
        this.session_id = null;
    }

    sendEvent(name) {
        const event = new CustomEvent(name);
        document.dispatchEvent(event);
    }

    get params() {
        return new Proxy(new URLSearchParams(window.location.search), {
            get: (searchParams, prop) => searchParams.get(prop),
        });
    }

    async handleGame(game, options = null) {
        this.game = new InfinityArcadeGame(this, game);
        await this.game.setup();

        if (options.parent_id && options.chat_id && options.action == "resume") {
            this.game.parent_id = options.parent_id;
            this.game.chat_id = options.chat_id;
            this.ui.button1.innerHTML = `Resume ${this.game.game.title}!`;
        }
    }

    async handleGenerate() {
        const prompt_text = this.params.prompt_text;
        console.log("PROMPT TEXT", prompt_text);

        if (!prompt_text) {
            console.log("NEEDS PROMPT");
            // TODO: show ui
            return;
        }

        const game = await this.api.generateGame(prompt_text);
        document.location = `/${game.slug}`;
    }

    async handleRadio(game_id, music_prompt_text, music_prompt_seed_image) {
        return;

        this.radio.initialize(game_id);

        if (!music_prompt_text) {
            const music = await this.radio.generatePrompt();
            this.radio.injectRadio(music);
        }
    }

    static async initialize(api) {
        const ia = new InfinityArcade();
        ia.session_id = await ia.getOrCreateSession();
        console.log(`initialized InfinityArcade with session_id ${ia.session_id}`);
        return ia;
    }

    async getOrCreateSession() {
        let session_id = getCookie("ia_session_id");
        if (!session_id) {
            session_id = await this.api.createSession();
            setCookie("ia_session_id", session_id);
        }

        if (!session_id) {
            throw "Error: Could not create session";
        }

        return session_id;
    }
}

module.exports = InfinityArcade;