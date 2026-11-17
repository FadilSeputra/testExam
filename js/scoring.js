const scoring = {
    // Generate UUID v4
    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    calculateScore(type, questions, answers, timeUsed) {
        const result = {
            id: this.uuidv4(),
            date: new Date().toISOString(),
            type: type,
            total: questions.length,
            timeUsed: timeUsed
        };

        if (['logic', 'numeric', 'verbal', 'aws_saa', 'aws_clf', 'cbt1', 'cbt'].includes(type)) {
            let correct = 0;
            const details = [];
            questions.forEach((q, idx) => {
                const userAns = answers[idx];
                const correctAns = q.answer;
                let isCorrect = false;

                if (userAns !== undefined) {
                    if (Array.isArray(correctAns)) {
                        if (Array.isArray(userAns)) {
                            const sortedUser = [...userAns].sort((a, b) => a - b);
                            const sortedCorrect = [...correctAns].sort((a, b) => a - b);
                            isCorrect = (sortedUser.length === sortedCorrect.length) &&
                                        sortedUser.every((val, i) => val === sortedCorrect[i]);
                        }
                    } else {
                        isCorrect = (userAns === correctAns);
                    }
                }

                if (isCorrect) {
                    correct++;
                }
                details.push({
                    id: q.id,
                    question: q.question || q.scenario,
                    options: q.options,
                    userAnswer: userAns,
                    correctAnswer: correctAns,
                    isCorrect: isCorrect,
                    isMultiSelect: Array.isArray(correctAns),
                    explanation: q.explanation
                });
            });
            result.correct = correct;
            result.score = (correct / questions.length) * 100;
            result.details = details;
        } 
        else if (type === 'disc') {
            let d = 0, i = 0, s = 0, c = 0;
            questions.forEach((q, idx) => {
                const ansIdx = answers[idx];
                if (ansIdx !== undefined) {
                    const opt = q.options[ansIdx];
                    d += opt.d || 0;
                    i += opt.i || 0;
                    s += opt.s || 0;
                    c += opt.c || 0;
                }
            });
            const total = d + i + s + c;
            if (total > 0) {
                result.disc = {
                    d: Math.round((d / total) * 100),
                    i: Math.round((i / total) * 100),
                    s: Math.round((s / total) * 100),
                    c: Math.round((c / total) * 100)
                };
            } else {
                result.disc = { d:0, i:0, s:0, c:0 };
            }
            result.score = 0; // DISC doesn't have a standard score
        }
        else if (type === 'sjt') {
            let score = 0;
            let maxScore = questions.length * 4; // Assuming max score per option is 4
            
            questions.forEach((q, idx) => {
                const ansIdx = answers[idx];
                if (ansIdx !== undefined) {
                    score += q.options[ansIdx].score || 0;
                }
            });
            
            result.rawScore = score;
            result.score = (score / maxScore) * 100;
        }

        return result;
    },

    getCategory(score, type) {
        if (type === 'aws_saa') {
            if (score >= 72) return { label: 'LULUS (PASS — AWS Benchmark ≥ 72%)', color: 'success' };
            return { label: 'BELUM LULUS (FAIL — AWS Benchmark < 72%)', color: 'error' };
        }
        if (score >= 80) return { label: 'Sangat Baik', color: 'success' };
        if (score >= 60) return { label: 'Baik', color: 'primary' };
        if (score >= 40) return { label: 'Cukup', color: 'warning' };
        return { label: 'Perlu Ditingkatkan', color: 'error' };
    },

    getDominantDISC(disc) {
        const arr = [
            { key: 'D', val: disc.d, name: 'Dominance', desc: 'Pemimpin yang tegas, berorientasi pada hasil, dan pemecah masalah yang cepat.' },
            { key: 'I', val: disc.i, name: 'Influence', desc: 'Komunikator yang baik, antusias, optimis, dan suka berkolaborasi.' },
            { key: 'S', val: disc.s, name: 'Steadiness', desc: 'Pendengar yang baik, sabar, dapat diandalkan, dan menyukai harmoni tim.' },
            { key: 'C', val: disc.c, name: 'Compliance', desc: 'Analitis, berorientasi pada detail, sistematis, dan mengutamakan kualitas.' }
        ];
        
        arr.sort((a, b) => b.val - a.val);
        const top = arr[0];
        
        return {
            profile: top.name,
            desc: top.desc
        };
    },

    saveResult(result) {
        const history = this.getHistory();
        history.push(result);
        localStorage.setItem('psikotes_history', JSON.stringify(history));
    },

    getHistory() {
        const data = localStorage.getItem('psikotes_history');
        return data ? JSON.parse(data) : [];
    },

    clearHistory() {
        if(confirm('Anda yakin ingin menghapus semua riwayat tes?')) {
            localStorage.removeItem('psikotes_history');
        }
    },

    generateComprehensiveFeedback(results) {
        const logic = results.find(r => r.type === 'logic');
        const numeric = results.find(r => r.type === 'numeric');
        const verbal = results.find(r => r.type === 'verbal');
        const disc = results.find(r => r.type === 'disc');
        const sjt = results.find(r => r.type === 'sjt');

        const cogScores = [logic, numeric, verbal].filter(Boolean).map(r => r.score);
        const cogAvg = cogScores.length ? cogScores.reduce((a, b) => a + b, 0) / cogScores.length : 0;
        const sjtScore = sjt ? sjt.score : 0;
        const overallScore = Math.round((cogAvg * 0.6 + sjtScore * 0.4));

        const strengths = [];
        const improvements = [];
        const tips = [];

        // Cognitive analysis
        if (logic && logic.score >= 75) strengths.push('Kemampuan berpikir logis dan analitis yang kuat — penting untuk debugging dan problem-solving di IT.');
        if (logic && logic.score < 50) improvements.push('Perbanyak latihan deret angka, pola logis, dan silogisme untuk meningkatkan penalaran logis.');
        if (numeric && numeric.score >= 75) strengths.push('Kemampuan numerik yang baik — berguna untuk analisis data dan perhitungan di lingkungan perbankan.');
        if (numeric && numeric.score < 50) improvements.push('Latih kemampuan aritmatika, persentase, dan interpretasi data keuangan.');
        if (verbal && verbal.score >= 75) strengths.push('Pemahaman verbal yang kuat — mendukung komunikasi efektif dalam dokumentasi teknis.');
        if (verbal && verbal.score < 50) improvements.push('Tingkatkan kosakata dan kemampuan analogi verbal melalui membaca aktif.');
        if (sjt && sjt.score >= 75) strengths.push('Penilaian situasional yang matang — mampu mengambil keputusan profesional dengan baik.');
        if (sjt && sjt.score < 50) improvements.push('Pelajari etika kerja perbankan dan cara menangani situasi profesional di lingkungan korporat.');

        // DISC insights
        const discInsights = [];
        if (disc && disc.disc) {
            const d = disc.disc;
            const dom = this.getDominantDISC(d);
            discInsights.push(`Profil dominan Anda: ${dom.profile} — ${dom.desc}`);
            if (d.c >= 30) discInsights.push('Skor Compliance yang tinggi sangat cocok untuk peran IT yang membutuhkan ketelitian dan kepatuhan pada standar.');
            if (d.d >= 25) discInsights.push('Sifat Dominance Anda menunjukkan potensi kepemimpinan — cocok untuk memimpin proyek IT.');
            if (d.i >= 25) discInsights.push('Skor Influence yang baik menandakan kemampuan kolaborasi dan presentasi ide kepada tim.');
            if (d.s >= 25) discInsights.push('Sifat Steadiness menunjukkan Anda dapat diandalkan dan konsisten dalam bekerja.');
        }

        // General tips for Bank Mandiri IT Intern
        tips.push('Bank Mandiri menerapkan nilai AKHLAK (Amanah, Kompeten, Harmonis, Loyal, Adaptif, Kolaboratif) — tunjukkan nilai-nilai ini saat wawancara.');
        if (cogAvg >= 70) tips.push('Skor kognitif Anda cukup kompetitif. Fokuskan persiapan pada wawancara teknis dan portofolio IT.');
        if (cogAvg < 60) tips.push('Tingkatkan skor kognitif dengan latihan rutin minimal 30 menit per hari selama 2 minggu sebelum tes.');
        tips.push('Persiapkan pengetahuan dasar tentang sistem perbankan digital, core banking, dan keamanan data.');

        return {
            logic, numeric, verbal, disc, sjt,
            cogAvg: Math.round(cogAvg * 10) / 10,
            sjtScore: Math.round(sjtScore * 10) / 10,
            overallScore,
            overallCategory: this.getCategory(overallScore),
            strengths, improvements, tips, discInsights
        };
    }
};
