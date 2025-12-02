// Toast Notification System
// =====================================

const Toast = {
    container: null,

    // Initialize toast container
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(this.container);
        }
    },

    // Show toast notification
    show(message, type = 'info', duration = 3000) {
        this.init();

        const toast = document.createElement('div');
        toast.className = `toast-item transform translate-x-full transition-all duration-300 ease-out p-4 rounded-lg shadow-lg flex items-start gap-3 max-w-sm`;

        // Set colors based on type
        const styles = {
            success: 'bg-green-50 border-l-4 border-green-500 text-green-800',
            error: 'bg-red-50 border-l-4 border-red-500 text-red-800',
            warning: 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800',
            info: 'bg-blue-50 border-l-4 border-blue-500 text-blue-800'
        };

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.className += ` ${styles[type] || styles.info}`;

        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || icons.info} mt-0.5"></i>
            <div class="flex-1">
                <p class="text-sm font-semibold">${message}</p>
            </div>
            <button onclick="this.parentElement.remove()" class="text-current opacity-50 hover:opacity-100">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        this.container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.add('translate-x-full', 'opacity-0');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    },

    error(message, duration) {
        return this.show(message, 'error', duration);
    },

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
};

// Make globally available
window.Toast = Toast;
