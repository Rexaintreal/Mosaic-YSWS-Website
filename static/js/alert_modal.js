class AlertModal {
    constructor() {
        this.createModal();
    }

    createModal() {
        const existing = document.getElementById('custom-alert-modal');
        if (existing) existing.remove();
        const modal = document.createElement('div');
        modal.id = 'custom-alert-modal';
        modal.className = 'custom-alert-modal hidden';
        modal.innerHTML = `
            <div class="custom-alert-content">
                <div class="alert-icon" id="alert-icon"></div>
                <h3 id="alert-title">Alert</h3>
                <p id="alert-message"></p>
                <div class="alert-buttons">
                    <button class="alert-btn alert-btn-primary" id="alert-confirm">OK</button>
                    <button class="alert-btn alert-btn-secondary hidden" id="alert-cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (!document.getElementById('custom-alert-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-alert-styles';
            style.textContent = `
                .custom-alert-modal {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    backdrop-filter: blur(4px);
                    animation: fadeIn 0.2s ease-out;
                }

                .custom-alert-modal.hidden {
                    display: none;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                .custom-alert-content {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
                    max-width: 450px;
                    width: 90%;
                    text-align: center;
                    animation: slideIn 0.3s ease-out;
                }

                .alert-icon {
                    width: 60px;
                    height: 60px;
                    margin: 0 auto 20px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                }

                .alert-icon.success {
                    background-color: #d4edda;
                    color: #155724;
                }

                .alert-icon.error {
                    background-color: #f8d7da;
                    color: #721c24;
                }

                .alert-icon.warning {
                    background-color: #fff3cd;
                    color: #856404;
                }

                .alert-icon.info {
                    background-color: #d1ecf1;
                    color: #0c5460;
                }

                #alert-title {
                    margin: 0 0 15px 0;
                    font-size: 24px;
                    color: #2c3e50;
                }

                #alert-message {
                    margin: 0 0 25px 0;
                    font-size: 16px;
                    color: #666;
                    line-height: 1.6;
                }

                .alert-buttons {
                    display: flex;
                    gap: 10px;
                    justify-content: center;
                }

                .alert-btn {
                    padding: 12px 30px;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .alert-btn-primary {
                    background-color: #2a9d8f;
                    color: white;
                }

                .alert-btn-primary:hover {
                    background-color: #238276;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(42, 157, 143, 0.3);
                }

                .alert-btn-secondary {
                    background-color: transparent;
                    color: #2c3e50;
                    border: 2px solid #ecf0f1;
                }

                .alert-btn-secondary:hover {
                    border-color: #2c3e50;
                    background-color: #ecf0f1;
                }
            `;
            document.head.appendChild(style);
        }
    }

    show(message, type = 'info', title = null) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const icon = document.getElementById('alert-icon');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const confirmBtn = document.getElementById('alert-confirm');
            const cancelBtn = document.getElementById('alert-cancel');

            const icons = {
                success: '✓',
                error: '✕',
                warning: '!',
                info: 'i'
            };

            icon.textContent = icons[type] || icons.info;
            icon.className = `alert-icon ${type}`;

            const titles = {
                success: 'Success',
                error: 'Error',
                warning: 'Warning',
                info: 'Information'
            };
            titleEl.textContent = title || titles[type] || 'Alert';

            messageEl.textContent = message;

            cancelBtn.classList.add('hidden');

            modal.classList.remove('hidden');

            const handleConfirm = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                resolve(true);
            };

            confirmBtn.addEventListener('click', handleConfirm);
        });
    }

    confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const icon = document.getElementById('alert-icon');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const confirmBtn = document.getElementById('alert-confirm');
            const cancelBtn = document.getElementById('alert-cancel');

            icon.textContent = '?';
            icon.className = 'alert-icon warning';

            titleEl.textContent = title;
            messageEl.textContent = message;
            cancelBtn.classList.remove('hidden');
            confirmBtn.textContent = 'Confirm';
            modal.classList.remove('hidden');
            const handleConfirm = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                confirmBtn.textContent = 'OK';
                resolve(true);
            };
            const handleCancel = () => {
                modal.classList.add('hidden');
                confirmBtn.removeEventListener('click', handleConfirm);
                cancelBtn.removeEventListener('click', handleCancel);
                confirmBtn.textContent = 'OK';
                resolve(false);
            };

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', handleCancel);
        });
    }
}

const alertModal = new AlertModal();

window.showAlert = (message, type = 'info', title = null) => {
    return alertModal.show(message, type, title);
};

window.showConfirm = (message, title = 'Confirm Action') => {
    return alertModal.confirm(message, title);
};

window.alert = (message) => {
    return alertModal.show(message, 'info');
};

window.confirm = (message) => {
    return alertModal.confirm(message);
};