import listen_all from './src/services/collect_events.service.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting blockchain event listeners...');

listen_all()
    .then(() => {
        console.log('Listeners finished (this should not happen in while(true) loop)');
    })
    .catch((error) => {
        console.error('Fatal error in listeners:', error);
        process.exit(1);
    });
