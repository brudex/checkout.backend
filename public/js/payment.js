// Payment Interface Functionality
document.addEventListener('DOMContentLoaded', () => {
    // Visa Payment Form
    const visaForm = {
        form: document.querySelector('#visa-content form'),
        cardNumber: document.querySelector('#cardNumber'),
        expiry: document.querySelector('#expiry'),
        cvv: document.querySelector('#cvv'),
        submitButton: document.querySelector('#visa-content .btn-visa'),

        init() {
            if (!this.form) return;

            if (this.cardNumber) {
                this.cardNumber.addEventListener('input', (e) => this.formatCardNumber(e));
            }
            
            if (this.expiry) {
                this.expiry.addEventListener('input', (e) => this.formatExpiry(e));
            }
            
            if (this.cvv) {
                this.cvv.addEventListener('input', (e) => this.formatCVV(e));
            }

            if (this.submitButton) {
                this.submitButton.addEventListener('click', (e) => this.handleSubmit(e));
            }
        },

        formatCardNumber(event) {
            let value = event.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})/g, '$1 ').trim();
            event.target.value = value.substring(0, 19); // Limit to 16 digits + 3 spaces
        },

        formatExpiry(event) {
            let value = event.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2);
            }
            event.target.value = value.substring(0, 5); // Limit to MM/YY format
        },

        formatCVV(event) {
            let value = event.target.value.replace(/\D/g, '');
            event.target.value = value.substring(0, 3); // Limit to 3 digits
        },

        async handleSubmit(event) {
            event.preventDefault();
            
            const trxnId = document.querySelector('meta[name="trxn-id"]')?.getAttribute('content');
            if (!trxnId) {
                console.error('Transaction ID not found');
                return;
            }

            try {
                const response = await fetch('/api/visaPaymentRequest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        trxnId: trxnId,
                        cardNumber: this.cardNumber.value.replace(/\s/g, ''),
                        expiry: this.expiry.value,
                        cvv: this.cvv.value
                    })
                });

                const data = await response.json();
                if (data.status === "00" && data.clientSecret) {
                    // Handle successful payment initiation
                    window.location.href = `/status/${trxnId}`;
                } else {
                    // Show error in modal
                    const modal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));
                    modal.show();
                }
            } catch (error) {
                console.error('Error processing payment:', error);
            }
        }
    };

    // Mobile Money Payment Form
    const mobileMoneyForm = {
        form: document.querySelector('#mobile-content form'),
        countrySelect: document.querySelector('#countrySelect'),
        networkSelect: document.querySelector('#networkSelect'),
        phoneInput: document.querySelector('#phoneNumber'),
        submitButton: document.querySelector('#mobile-content .btn-mobile'),

        init() {
            if (!this.form) return;

            if (this.submitButton) {
                this.submitButton.addEventListener('click', (e) => this.handleSubmit(e));
            }

            if (this.phoneInput) {
                this.phoneInput.addEventListener('input', (e) => this.formatPhoneNumber(e));
            }
        },

        formatPhoneNumber(event) {
            let value = event.target.value.replace(/\D/g, '');
            event.target.value = value;
        },

        async handleSubmit(event) {
            event.preventDefault();
            
            const trxnId = document.querySelector('meta[name="trxn-id"]')?.getAttribute('content');
            if (!trxnId) {
                console.error('Transaction ID not found');
                return;
            }

            try {
                const response = await fetch('/api/walletPaymentRequest', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        trxnId: trxnId,
                        mobileNumber: this.phoneInput.value,
                        mobileNetwork: this.networkSelect.value
                    })
                });

                const data = await response.json();
                if (data.status === "00") {
                    // Show pending payment modal
                    const modal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));
                    modal.show();
                    
                    // Start polling for payment status
                    this.pollPaymentStatus(trxnId);
                } else {
                    // Show error in modal
                    const modal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));
                    modal.show();
                }
            } catch (error) {
                console.error('Error processing payment:', error);
            }
        },

        async pollPaymentStatus(trxnId) {
            const maxAttempts = 30;
            let attempts = 0;
            
            const checkStatus = async () => {
                try {
                    const response = await fetch(`/api/paymentStatus/${trxnId}`);
                    const data = await response.json();
                    
                    if (data.status === 'COMPLETED') {
                        window.location.href = `/status/${trxnId}`;
                        return;
                    }
                    
                    if (data.status === 'FAILED') {
                        // Show error in modal
                        const modal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));
                        modal.show();
                        return;
                    }
                    
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkStatus, 5000); // Check every 5 seconds
                    }
                } catch (error) {
                    console.error('Error checking payment status:', error);
                }
            };
            
            checkStatus();
        }
    };

    // Crypto Payment Functionality
    const cryptoPayment = {
        select: document.querySelector('#cryptoSelect'),
        warningMessage: document.querySelector('#cryptoWarning'),
        qrcodeDiv: document.querySelector('#qrcode'),
        cryptoAddress: document.querySelector('#cryptoAddress'),
        copyAddressBtn: document.querySelector('#copyAddressBtn'),
        submitButton: document.querySelector('#crypto-content .btn-crypto'),
        addressesData: document.querySelector('#cryptoAddressesData'),
        
        addresses: {},

        init() {
            if (!this.select || !this.qrcodeDiv) return;
            
            // Load addresses from backend data
            try {
                this.addresses = JSON.parse(this.addressesData.value);
            } catch (error) {
                console.error('Error parsing crypto addresses:', error);
                return;
            }
            
            // Initialize with first cryptocurrency (USDT)
            this.generateQRCode(this.addresses.USDT);
            this.updateWarning('USDT');
            if (this.cryptoAddress) {
                this.cryptoAddress.textContent = this.addresses.USDT;
            }
            
            this.select.addEventListener('change', (e) => {
                const selectedCrypto = e.target.value;
                const address = this.addresses[selectedCrypto];
                this.generateQRCode(address);
                this.updateWarning(selectedCrypto);
                if (this.cryptoAddress) {
                    this.cryptoAddress.textContent = address;
                }
            });

            if (this.copyAddressBtn) {
                this.copyAddressBtn.addEventListener('click', () => this.copyAddress());
            }

            if (this.submitButton) {
                this.submitButton.addEventListener('click', () => this.verifyPayment());
            }
        },

        generateQRCode(address) {
            // Clear previous QR code
            this.qrcodeDiv.innerHTML = '';
            
            // Generate new QR code
            const qr = qrcode(0, 'M');
            qr.addData(address);
            qr.make();
            
            // Create QR code image with proper styling
            const qrImage = qr.createImgTag(6);
            this.qrcodeDiv.innerHTML = qrImage;
            
            // Add styling to QR code image
            const img = this.qrcodeDiv.querySelector('img');
            if (img) {
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            }
        },

        updateWarning(cryptocurrency) {
            if (this.warningMessage) {
                this.warningMessage.innerHTML = `
                    <i data-lucide="alert-triangle" class="size-4 text-warning me-1"></i>
                    Please send only ${cryptocurrency} to this address. Sending any other cryptocurrency may result in permanent loss.
                `;
                // Reinitialize Lucide icons for the new warning message
                lucide.createIcons();
            }
        },

        async copyAddress() {
            const address = this.cryptoAddress.textContent;
            try {
                await navigator.clipboard.writeText(address);
                // Show success feedback
                this.copyAddressBtn.innerHTML = '<i data-lucide="check" class="size-4"></i>';
                lucide.createIcons();
                setTimeout(() => {
                    this.copyAddressBtn.innerHTML = '<i data-lucide="copy" class="size-4"></i>';
                    lucide.createIcons();
                }, 2000);
            } catch (err) {
                console.error('Failed to copy address:', err);
            }
        },

        async verifyPayment() {
            const trxnId = document.querySelector('meta[name="trxn-id"]')?.getAttribute('content');
            if (!trxnId) {
                console.error('Transaction ID not found');
                return;
            }

            try {
                const response = await fetch(`/api/paymentStatus/${trxnId}`);
                const data = await response.json();
                
                if (data.status === 'COMPLETED') {
                    window.location.href = `/status/${trxnId}`;
                } else {
                    // Show pending/error message
                    const modal = new bootstrap.Modal(document.getElementById('paymentStatusModal'));
                    modal.show();
                }
            } catch (error) {
                console.error('Error verifying payment:', error);
            }
        }
    };

    // Initialize all payment forms
    visaForm.init();
    mobileMoneyForm.init();
    cryptoPayment.init();
});