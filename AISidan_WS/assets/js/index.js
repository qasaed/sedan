document.getElementById('authForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = document.getElementById('submitBtn');
            const btnText = document.getElementById('btnText');
            const spinner = document.getElementById('spinner');
            
            // 1. تفعيل حالة التحميل في الزر
            btn.disabled = true;
            btnText.textContent = 'جاري التحقق...';
            spinner.style.display = 'block';
            
            // 2. محاكاة طلب قاعدة البيانات / API بمدة ثانية ونصف
            setTimeout(() => {
                // 3. التوجيه لصفحة لوحة القيادة
                window.location.href = 'home.html';
            }, 1500);
        });
