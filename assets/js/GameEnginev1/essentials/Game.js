import GameControl from './GameControl.js';
import GameUI from './GameUI.js';

class Game {
    constructor(environment) {
        this.environment = environment;
        this.path = environment.path;
        this.gameContainer = environment.gameContainer;
        this.gameCanvas = environment.gameCanvas;
        this.pythonURI = environment.pythonURI;
        this.javaURI = environment.javaURI;
        this.fetchOptions = environment.fetchOptions;
        this.uid = null;
        this.id = null;
        this.gname = null;

        this.initUser();
        const gameLevelClasses = environment.gameLevelClasses;
        this.gameControl = new GameControl(this, gameLevelClasses);
        
        // Initialize GameUI if configuration is provided
        if (environment.gameUI) {
            this.gameUI = new GameUI(this, environment.gameUI);
            this.gameUI.init();
        }
        
        this.gameControl.start();
    }

    static main(environment) {
        return new Game(environment);
    }

    initUser() {
        // Skip user initialization if no backend URIs are configured (e.g., in gamebuilder embed mode)
        if (!this.pythonURI || this.pythonURI === '') {
            console.log('Skipping user initialization - no backend configured');
            return;
        }

        const pythonURL = this.pythonURI + '/api/id';
        fetch(pythonURL, this.fetchOptions)
            .then(response => {
                if (response.status !== 200) {
                    console.warn("Could not fetch user ID (HTTP " + response.status + "), continuing without user data");
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) {
                    console.log('No user data available, continuing game without user tracking');
                    return;
                }
                this.uid = data.uid;

                const javaURL = this.javaURI + '/api/person/uid/' + this.uid;
                return fetch(javaURL, this.fetchOptions);
            })
            .then(response => {
                if (!response) return;
                if (!response.ok) {
                    console.warn(`Spring server unavailable (${response.status}), continuing without user data`);
                    return null;
                }
                return response.json();
            })
            .then(data => {
                if (!data) return;
                this.id = data.id;
            })
            .catch(error => {
                console.warn("User initialization failed (non-critical):", error.message);
                // Don't stop the game - user tracking is optional
            });
    }
}

export default Game;