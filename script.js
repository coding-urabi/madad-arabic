let allData = [];

const mainToSubMap = {
  "الاستماع": [
    "الاستماع إلى المحادثات", "الاستماع إلى النصوص الأدبية", "الاستماع إلى الأخبار والتقارير",
    "التمييز بين الأصوات والكلمات", "الاستماع مع الفهم", "الاستماع النقدي", "التخمين قبل الاستماع"
  ],
  "التحدث": [
    "التعبير عن الأفكار والمشاعر", "التحدث بشكل دقيق وصحيح", "الاستجابة للمواقف اليومية",
    "إجراء المناقشات", "التحاور والمفاوضات", "الحديث بشكل فصيح"
  ],
  "القراءة": [
    "قراءة النصوص الأدبية", "قراءة النصوص التعليمية", "القراءة الاستيعابية",
    "القراءة النقدية", "القراءة السريعة", "التفسير والتحليل النصي", "فهم الأسئلة المتعلقة بالمقروء"
  ],
  "الكتابة": [
    "كتابة الجمل", "تعرف أدوات الربط واستخدامها", "كتابة الفقرات", "كتابة المقالات",
    "كتابة النصوص الإبداعية", "الإملاء والتدقيق اللغوي", "استخدام علامات الترقيم", "التنظيم الكتابي"
  ],
  "القواعد": [
    "الإعراب", "الضمائر", "الجمل الاسمية والفعلية", "أزمنة الأفعال", "الحروف والأدوات", "موضوعات في النحو والصرف"
  ],
  "المفردات": [
    "التوسع في المفردات", "استخدام الكلمات في السياق", "التعريف والتركيب",
    "المرادف والمضاد والمشترك اللفظي", "التعرف على الكلمات الشائعة", "المفردات المتخصصة"
  ],
  "التفسير والتحليل": [
    "تفسير النصوص الأدبية", "تحليل النصوص العلمية", "استخلاص الأفكار الرئيسية",
    "التفسير البلاغي", "التفسير الاجتماعي", "التحليل النقدي"
  ],
  "الإملاء": ["كتابة الكلمات بشكل صحيح", "التدقيق الإملائي"]
};

// تحميل ملف Excel مباشرة من الموقع
async function loadExcelFromServer() {
  const res = await fetch ("مهارات_ومصطلحات.xlsx")
  const ab = await res.arrayBuffer();
  const workbook = XLSX.read(ab, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  allData = XLSX.utils.sheet_to_json(sheet);
}

// عند تحميل الصفحة
window.onload = async () => {
    await loadExcelFromServer();  // فقط تحميل ملف Excel
  };
  

// عند اختيار المهارة الرئيسية
document.getElementById("mainSkill").addEventListener("change", () => {
  const selectedMain = document.getElementById("mainSkill").value;
  const subSkillSelect = document.getElementById("subSkill");
  const termSelect = document.getElementById("term");

  subSkillSelect.innerHTML = '<option value="">اختر المهارة الفرعية</option>';
  termSelect.innerHTML = '<option value="">اختر المصطلح</option>';

  if (mainToSubMap[selectedMain]) {
    mainToSubMap[selectedMain].forEach(sub => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      subSkillSelect.appendChild(option);
    });
  }
});

// عند اختيار المهارة الفرعية
document.getElementById("subSkill").addEventListener("change", () => {
  const selectedSub = document.getElementById("subSkill").value;
  const termSelect = document.getElementById("term");

  termSelect.innerHTML = '<option value="">اختر المصطلح</option>';

  const filteredTerms = allData.filter(item => 
    item["المهارة الفرعية"]?.trim() === selectedSub.trim()
  );
  
  const uniqueTerms = [...new Set(filteredTerms.map(item => item["المصطلح"]))];

  uniqueTerms.forEach(term => {
    const option = document.createElement("option");
    option.value = term;
    option.textContent = term;
    termSelect.appendChild(option);
  });

  document.getElementById("contentBox").style.display = "none";
});

// عند اختيار المصطلح
document.getElementById("showContent").addEventListener("click", () => {
  const selectedSub = document.getElementById("subSkill").value;
  const selectedTerm = document.getElementById("term").value;

  if (!selectedTerm || !selectedSub) {
    alert("يرجى اختيار المهارة الفرعية والمصطلح.");
    return;
  }

  const match = allData.find(item =>
    item["المهارة الفرعية"]?.trim() === selectedSub.trim() &&
    item["المصطلح"]?.trim() === selectedTerm.trim()
  );
  

  if (match) {
    document.getElementById("contentText").textContent =
      match["النص الأول (نص + مصدر + تعليق تحليلي)"] || "لا يوجد نص مرتبط.";
  } else {
    document.getElementById("contentText").textContent = "لم يتم العثور على محتوى لهذا المصطلح.";
  }

  document.getElementById("contentBox").style.display = "block";
});

// زر النسخ
document.getElementById("copyButton").addEventListener("click", () => {
  const text = document.getElementById("contentText").textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("✅ تم نسخ المحتوى!");
  });
});