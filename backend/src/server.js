import app from './app.js';

const port = process.env.PORT || 3333;

async function start() {
    app.listen(port, () => console.log(`Server running on port ${port}`));
}
start();
