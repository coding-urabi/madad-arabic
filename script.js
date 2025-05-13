import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// إعداد Supabase
const supabaseUrl = "https://eibdmograufiybbqysvq.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYmRtb2dyYXVmaXliYnF5c3ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NDQyNzAsImV4cCI6MjA2MjIyMDI3MH0.tAKDSIDAa4hIi6F5lV7l3OKScHP8bJhZo51YnQH2C7A";
const supabase = createClient(supabaseUrl, supabaseKey);
let allData = [];

// إضافة إشعارات للمستخدم
function showNotification(message, isError = false) {
  alert(isError ? `❌ خطأ: ${message}` : `✅ ${message}`);
}

// تحميل البيانات من Supabase
async function loadDataFromSupabase() {
  try {
    const { data, error } = await supabase.from("madad_texts").select("*");
    if (error) {
      console.error("خطأ في تحميل البيانات:", error);
      showNotification(
        "حدث خطأ أثناء تحميل البيانات، يرجى المحاولة مرة أخرى.",
        true
      );
      return false;
    }

    allData = data || [];
    console.log("تم تحميل البيانات بنجاح:", allData.length);
    return true;
  } catch (err) {
    console.error("خطأ غير متوقع:", err);
    showNotification("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.", true);
    return false;
  }
}

// 🔄 تسجيل الزائر
async function registerVisit() {
  try {
    const ip = await fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => data.ip);

    const { error } = await supabase.from("visits").insert({
      ip_address: ip,
      visited_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ خطأ أثناء تسجيل الزيارة:", error);
    } else {
      console.log("✅ تم تسجيل الزيارة");
    }
  } catch (err) {
    console.error("❌ مشكلة في تسجيل الزيارة:", err);
  }
}

// التعامل مع النجوم
document.querySelectorAll(".rating-stars .star").forEach((star) => {
  star.addEventListener("click", async () => {
    const stars = parseInt(star.getAttribute("data-value"));

    // تلوين النجوم المختارة
    document.querySelectorAll(".rating-stars .star").forEach((s) => {
      s.classList.remove("selected");
      if (parseInt(s.getAttribute("data-value")) <= stars) {
        s.classList.add("selected");
      }
    });

    // إرسال التقييم لـ Supabase
    const { error } = await supabase.from("ratings").insert({
      stars: stars,
      rated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ خطأ أثناء حفظ التقييم:", error);
      document.getElementById("ratingResult").textContent =
        "❌ حدث خطأ أثناء إرسال التقييم.";
    } else {
      document.getElementById(
        "ratingResult"
      ).textContent = `✅ شكراً قمت بتقييمنا بـ ${stars} نجوم`;
      fetchAverageRating(); // تحديث المتوسط
    }
  });
});

// ✅ دالة حساب عدد الزوار
async function fetchVisitorCount() {
  try {
    console.log("🚀 بدء جلب عدد الزوار...");

    const { count, error } = await supabase
      .from("visits")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("❌ خطأ في جلب عدد الزوار:", error);
      return;
    }

    console.log("📊 عدد الزوار:", count);
    document.getElementById("visitorCount").textContent = count;
  } catch (err) {
    console.error("❌ خطأ غير متوقع في عداد الزوار:", err);
    document.getElementById("visitorCount").textContent = "خطأ 😢";
  }
}

async function fetchAverageRating() {
  try {
    console.log("🚀 بدء جلب التقييمات...");

    const { data, error } = await supabase.from("ratings").select("stars");

    if (error) {
      console.error("❌ خطأ في جلب التقييمات:", error);
      document.getElementById("averageRating").textContent =
        "خطأ في عرض التقييم.";
      return;
    }

    if (!data || data.length === 0) {
      document.getElementById("averageRating").textContent =
        "لا توجد تقييمات بعد.";
      return;
    }

    const total = data.reduce((sum, row) => sum + row.stars, 0);
    const avg = (total / data.length).toFixed(1);
    const count = data.length;

    document.getElementById(
      "averageRating"
    ).textContent = `⭐ متوسط التقييم: ${avg} من 5 (بناءً على ${count} تقييمات)`;
  } catch (err) {
    console.error("❌ خطأ غير متوقع:", err);
    document.getElementById("averageRating").textContent =
      "حدث خطأ أثناء حساب التقييم.";
  }
}

// تهيئة الصفحة عند التحميل
window.onload = async () => {
  await registerVisit();
  await fetchVisitorCount();
  await fetchAverageRating();
  try {
    const dataLoaded = await loadDataFromSupabase();
    if (!dataLoaded) return;

    // إخفاء أقسام البحث في البداية
    const skillSection = document.getElementById("skillSearchSection");
    const customSection = document.getElementById("customSearchSection");

    if (skillSection) skillSection.style.display = "none";
    if (customSection) customSection.style.display = "none";

    const mainSkillSelect = document.getElementById("mainSkill");
    if (!mainSkillSelect) {
      console.warn(
        "🟡 هذه الصفحة لا تحتوي على mainSkill، تم تجاوز تهيئة البحث."
      );
      return;
    }

    // تهيئة قائمة المهارات الرئيسية
    const uniqueMainSkills = [
      ...new Set(
        allData.map((item) => item["المهارة الرئيسية"]).filter(Boolean)
      ),
    ];

    mainSkillSelect.innerHTML =
      '<option value="">اختر المهارة الرئيسية</option>';
    uniqueMainSkills.forEach((skill) => {
      const option = document.createElement("option");
      option.value = skill;
      option.textContent = skill;
      mainSkillSelect.appendChild(option);
    });

    const skillSearchBtn = document.getElementById("skillSearchBtn");
    const customSearchBtn = document.getElementById("customSearchBtn");

    if (skillSearchBtn && customSearchBtn) {
      skillSearchBtn.addEventListener("click", () => {
        if (skillSection) skillSection.style.display = "block";
        if (customSection) customSection.style.display = "none";
      });

      customSearchBtn.addEventListener("click", () => {
        if (skillSection) skillSection.style.display = "none";
        if (customSection) customSection.style.display = "block";
      });
    }
  } catch (err) {
    console.error("❌ خطأ في تهيئة الصفحة:", err);
    showNotification(
      "❌ خطأ: حدث خطأ أثناء تهيئة الصفحة، يرجى تحديث الصفحة والمحاولة مرة أخرى.",
      true
    );
  }
};

// تحميل المهارات الفرعية عند اختيار المهارة الرئيسية
document.getElementById("mainSkill")?.addEventListener("change", () => {
  try {
    const selectedMain = document.getElementById("mainSkill").value;
    const subSkillSelect = document.getElementById("subSkill");
    const termSelect = document.getElementById("term");

    // إعادة تعيين القوائم المنسدلة
    subSkillSelect.innerHTML = '<option value="">اختر المهارة الفرعية</option>';
    termSelect.innerHTML = '<option value="">اختر المصطلح</option>';

    if (!selectedMain) return;

    // استخراج المهارات الفرعية المرتبطة بالمهارة الرئيسية المحددة
    const filteredSubSkills = [
      ...new Set(
        allData
          .filter((i) => i["المهارة الرئيسية"] === selectedMain)
          .map((i) => i["المهارة الفرعية"])
          .filter(Boolean)
      ),
    ];

    // إضافة المهارات الفرعية إلى القائمة المنسدلة
    filteredSubSkills.forEach((sub) => {
      const option = document.createElement("option");
      option.value = sub;
      option.textContent = sub;
      subSkillSelect.appendChild(option);
    });

    console.log(
      `تم تحميل ${filteredSubSkills.length} مهارة فرعية للمهارة "${selectedMain}"`
    );
  } catch (err) {
    console.error("خطأ في تحميل المهارات الفرعية:", err);
  }
});

// تحميل المصطلحات عند اختيار المهارة الفرعية
document.getElementById("subSkill")?.addEventListener("change", () => {
  try {
    const selectedSub = document.getElementById("subSkill").value;
    const termSelect = document.getElementById("term");

    // إعادة تعيين قائمة المصطلحات
    termSelect.innerHTML = '<option value="">اختر المصطلح</option>';

    if (!selectedSub) return;

    // استخراج المصطلحات المرتبطة بالمهارة الفرعية المحددة
    const filteredTerms = [
      ...new Set(
        allData
          .filter((i) => i["المهارة الفرعية"] === selectedSub)
          .map((i) => i["المصطلح"])
          .filter(Boolean)
      ),
    ];

    // إضافة المصطلحات إلى القائمة المنسدلة
    filteredTerms.forEach((term) => {
      const option = document.createElement("option");
      option.value = term;
      option.textContent = term;
      termSelect.appendChild(option);
    });

    console.log(
      `تم تحميل ${filteredTerms.length} مصطلح للمهارة الفرعية "${selectedSub}"`
    );
  } catch (err) {
    console.error("خطأ في تحميل المصطلحات:", err);
  }
});

// الاتصال بـ OpenAI لتوليد نصوص جديدة
async function generateFromOpenAI(term, subSkill) {
  try {
    console.log(`جاري توليد نص لـ "${term}" في المهارة "${subSkill}"...`);

    const response = await fetch(
      "https://eibdmograufiybbqysvq.supabase.co/functions/v1/generate-text",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, subSkill }),
      }
    );

    if (!response.ok) {
      throw new Error(`فشل الاتصال: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("تم توليد النص بنجاح:", result);
    return result;
  } catch (err) {
    console.error("خطأ في توليد النص:", err);
    showNotification("حدث خطأ أثناء توليد النص، يرجى المحاولة مرة أخرى.", true);
    // إرجاع نص افتراضي في حالة الفشل
    return {
      generatedText: "لم نتمكن من توليد نص في هذا الوقت. يرجى المحاولة لاحقًا.",
      example: "غير متوفر.",
    };
  }
}

function displayText(
  contentContainer,
  texts,
  exampleFromDB,
  wasGenerated = false
) {
  if (!contentContainer.dataset.appended) {
    contentContainer.innerHTML = "";
    contentContainer.dataset.appended = "true";
  }

  const generatedNotice = contentContainer
    .closest(".content-box")
    ?.querySelector(".ai-notice");
  if (generatedNotice) {
    generatedNotice.style.display = wasGenerated ? "block" : "none";
  }

  const textArray = Array.isArray(texts) ? texts : [texts];
  let displayed = false;

  textArray.forEach((fullText) => {
    let scientific = "غير متوفر.";
    let source = "غير متوفر.";
    let analysis = "غير متوفر.";
    let example = exampleFromDB || "غير متوفر.";

    // ✅ إذا كانت النصوص عبارة عن كائنات مفصلة
    if (typeof fullText === "object") {
      scientific = fullText.نص || fullText.generatedText || "غير متوفر.";
      source = fullText.المصدر || fullText.source || "غير متوفر.";
      analysis = fullText.التحليل || fullText.analysis || "غير متوفر.";
      example =
        fullText.المثال || fullText.example || exampleFromDB || "غير متوفر.";
    }

    // ✅ إذا كانت النصوص عبارة عن نص واحد طويل فيه الرموز
    else if (typeof fullText === "string") {
      const scientificMatch = fullText.match(
        /(?:📘|📜)?\s*النص\s*العلمي[:：]?\s*([\s\S]*?)(?=📚|🧠|🧪|$)/
      );
      const sourceMatch = fullText.match(
        /📚\s*المصدر[:：]?\s*([\s\S]*?)(?=🧠|🧪|$)/
      );
      const analysisMatch = fullText.match(
        /🧠\s*التعليق\s*التحليلي[:：]?\s*([\s\S]*?)(?=🧪|$)/
      );
      const exampleMatch = fullText.match(
        /🧪\s*مثال\s*تطبيقي[:：]?\s*([\s\S]*)/
      );

      scientific = scientificMatch?.[1]?.trim() || fullText.trim();
      source = sourceMatch?.[1]?.trim() || "غير متوفر.";
      analysis = analysisMatch?.[1]?.trim() || "غير متوفر.";
      example = exampleMatch?.[1]?.trim() || exampleFromDB || "غير متوفر.";
    }

    if (!scientific || scientific === "غير متوفر.") return;

    const box = document.createElement("div");
    box.className = "single-text-box";
    box.innerHTML = `
      <div class="main-text"><strong>📘 النص العلمي:</strong><br>${scientific}</div>
      <div class="source-text"><strong>📚 المصدر:</strong><br>${source}</div>
      <div class="analysis-text"><strong>🧠 التعليق التحليلي:</strong><br>${analysis}</div>
      <div class="example-text"><strong>🧪 مثال تطبيقي:</strong><br>${example}</div>
    `;
    contentContainer.appendChild(box);
    displayed = true;
  });

  if (displayed) {
    const box = contentContainer.closest(".content-box");
    if (box) box.style.display = "block";
  }

  const exportButtons = document.getElementById("exportButtons");
  if (exportButtons) {
    exportButtons.style.display = displayed ? "flex" : "none";
  }
}

// عرض النصوص عند الضغط على زر "عرض النص"
document.getElementById("showContent")?.addEventListener("click", async () => {
  try {
    const exportButtons = document.getElementById("exportButtons");
    if (exportButtons) exportButtons.style.display = "none";

    const main = document.getElementById("mainSkill").value;
    const sub = document.getElementById("subSkill").value;
    const term = document.getElementById("term").value;
    const contentDiv = document.getElementById("contentText");

    // التحقق من اكتمال الاختيارات
    if (!main || !sub || !term) {
      return showNotification(
        "يرجى اختيار جميع الحقول: المهارة الرئيسية، المهارة الفرعية، والمصطلح.",
        true
      );
    }

    // إظهار مؤشر التحميل
    contentDiv.innerHTML = "<p>جاري تحميل النصوص شكرًا لصبركم...</p>";
    document.getElementById("contentBox").style.display = "block";

    console.log(`البحث عن نصوص للمصطلح "${term}" في المهارة "${sub}"...`);

    // البحث عن المصطلح في البيانات
    let match = allData.find(
      (i) => i["المهارة الفرعية"] === sub && i["المصطلح"] === term
    );

    let texts = [];
    let example = "لا يوجد مثال متاح.";
    let wasGenerated = false;

    if (match) {
      console.log("تم العثور على المصطلح في قاعدة البيانات:", match);
      texts = match["النصوص"] || [];
      example = match["مثال تطبيقي"] || example;
      wasGenerated = match["تم توليده"] || false;

      // توليد نصوص إضافية إذا كان عدد النصوص أقل من 5
      if (texts.length < 5) {
        console.log(
          `عدد النصوص الموجودة (${texts.length}) أقل من 5. جاري توليد النصوص المتبقية...`
        );
        const generated = [];
        for (let i = texts.length; i < 5; i++) {
          const res = await generateFromOpenAI(term, sub);
          generated.push(res);
        }

        // إضافة النصوص المولدة إلى المصفوفة الحالية
        texts = [
          ...texts,
          ...generated.map(
            (r) =>
              `📘 النص العلمي: ${r.generatedText || "غير متوفر."}
          📚 المصدر: ${r.source || "غير متوفر."}
          🧠 التعليق التحليلي: ${r.analysis || "غير متوفر."}
          🧪 مثال تطبيقي: ${r.example || "غير متوفر."}`
          ),
        ];

        // استخدام المثال التطبيقي من أول نص مولد إذا لم يكن هناك مثال موجود بالفعل
        if (example === "لا يوجد مثال متاح." && generated[0]?.example) {
          example = generated[0].example;
        }

        wasGenerated = true;

        // تحديث البيانات في قاعدة البيانات
        const { error } = await supabase.from("madad_texts").upsert(
          {
            "المهارة الرئيسية": main,
            "المهارة الفرعية": sub,
            المصطلح: term,
            النصوص: texts,
            "مثال تطبيقي": example,
            "تم توليده": true,
          },
          { onConflict: ["المصطلح"] }
        );

        if (error) {
          console.error("خطأ في تحديث قاعدة البيانات:", error);
        } else {
          console.log("تم تحديث البيانات في قاعدة البيانات بنجاح");
        }
      }
    } else {
      // توليد نصوص جديدة إذا لم يتم العثور على المصطلح
      console.log(
        "لم يتم العثور على المصطلح في قاعدة البيانات. جاري توليد نصوص جديدة..."
      );
      const generated = [];
      for (let i = 0; i < 3; i++) {
        const res = await generateFromOpenAI(term, sub);
        generated.push(res);
      }

      texts = generated.map((r) => {
        return `📘 النص العلمي: ${r.generatedText || "غير متوفر."}
📚 المصدر: ${r.source || "غير متوفر."}
🧠 التعليق التحليلي: ${r.analysis || "غير متوفر."}
🧪 مثال تطبيقي: ${r.example || "غير متوفر."}`;
      });

      // إضافة البيانات إلى قاعدة البيانات
      const { error } = await supabase.from("madad_texts").insert({
        "المهارة الرئيسية": main,
        "المهارة الفرعية": sub,
        المصطلح: term,
        النصوص: texts,
        "مثال تطبيقي": example,
        "تم توليده": true,
      });

      if (error) {
        console.error("خطأ في إضافة البيانات إلى قاعدة البيانات:", error);
      } else {
        console.log("تم إضافة البيانات إلى قاعدة البيانات بنجاح", true);

        // تحديث المتغير allData بالبيانات الجديدة
        allData.push({
          "المهارة الرئيسية": main,
          "المهارة الفرعية": sub,
          المصطلح: term,
          النصوص: texts,
          "مثال تطبيقي": example,
          "تم توليده": true,
        });
      }
    }

    // عرض النصوص
    displayText(contentDiv, texts, example, wasGenerated);
  } catch (err) {
    console.error("خطأ في عرض النصوص:", err);
    showNotification("حدث خطأ أثناء عرض النصوص، يرجى المحاولة مرة أخرى.", true);

    // إعادة تعيين العرض
    const contentDiv = document.getElementById("contentText");
    if (contentDiv) {
      contentDiv.innerHTML =
        "<p>حدث خطأ في عرض النصوص. يرجى المحاولة مرة أخرى.</p>";
    }
  }
});

// البحث المخصص عن المصطلحات

document
  .getElementById("searchCustomTerm")
  ?.addEventListener("click", async () => {
    try {
      const term = document.getElementById("customTerm").value.trim();
      const contentDiv = document.getElementById("customContentText");

      // التحقق من إدخال المصطلح
      if (!term) {
        return showNotification("يرجى إدخال المصطلح للبحث.", true);
      }

      // إظهار مؤشر التحميل
      contentDiv.innerHTML = "<p>جاري تحميل النصوص شكرًا لصبركم...</p>";
      document.getElementById("customContentBox").style.display = "block";

      console.log(`البحث عن المصطلح المخصص "${term}"...`);

      // البحث عن المصطلح في البيانات
      const match = allData.find((i) => i["المصطلح"] === term);

      if (match) {
        // عرض النصوص الموجودة
        console.log("تم العثور على المصطلح المخصص في قاعدة البيانات:", match);
        contentDiv.innerHTML = "";

        displayText(
          contentDiv,
          match["النصوص"],
          match["مثال تطبيقي"] || "غير متوفر.",
          match["تم توليده"] || false
        );
      } else {
        // توليد3 نصوص دفعة واحدة
        const generated = [];
        for (let i = 0; i < 3; i++) {
          const res = await generateFromOpenAI(term, "أخرى");
          generated.push(res);
        }

        // تنسيق النصوص
        const formattedTexts = generated.map(
          (r) =>
            `📘 النص العلمي: ${r.generatedText || "غير متوفر."}
📚 المصدر: ${r.source || "غير متوفر."}
🧠 التعليق التحليلي: ${r.analysis || "غير متوفر."}
🧪 مثال تطبيقي: ${r.example || "غير متوفر."}`
        );

        // حفظ النصوص في Supabase
        const { error } = await supabase.from("madad_texts").insert({
          "المهارة الرئيسية": "أخرى",
          "المهارة الفرعية": "أخرى",
          المصطلح: term,
          النصوص: formattedTexts,
          "مثال تطبيقي": generated[0]?.example || "غير متوفر.",
          "تم توليده": true,
        });

        delete contentDiv.dataset.appended;

        // عرض النصوص المولدة
        displayText(
          contentDiv,
          formattedTexts,
          generated[0]?.example || "غير متوفر.",
          true
        );

        // ✅ إظهار أزرار التصدير
        const customExportButtons = document.getElementById(
          "customExportButtons"
        );
        if (customExportButtons) {
          customExportButtons.style.display = "flex";
        }
      }
    } catch (err) {
      console.error("خطأ في البحث المخصص:", err);
      showNotification(
        "حدث خطأ أثناء البحث المخصص، يرجى المحاولة مرة أخرى.",
        true
      );

      // إعادة تعيين العرض
      const contentDiv = document.getElementById("customContentText");
      if (contentDiv) {
        contentDiv.innerHTML =
          "<p>حدث خطأ في البحث. يرجى المحاولة مرة أخرى.</p>";
      }
    }
  });

// نسخ المحتوى
document.getElementById("copyAllButton")?.addEventListener("click", () => {
  try {
    const boxes = document.querySelectorAll("#contentText .single-text-box");
    if (boxes.length === 0) {
      return showNotification("لا يوجد محتوى لنسخه.", true);
    }

    const fullText = [...boxes]
      .map((b) => b.textContent.trim())
      .join("\n\n--------------------\n\n");

    navigator.clipboard
      .writeText(fullText)
      .then(() => showNotification("تم نسخ جميع المحتويات بنجاح!"))
      .catch((err) => {
        console.error("خطأ في نسخ المحتوى:", err);
        showNotification("حدث خطأ أثناء نسخ المحتوى.", true);
      });
  } catch (err) {
    console.error("خطأ في نسخ المحتوى:", err);
    showNotification("حدث خطأ أثناء نسخ المحتوى.", true);
  }
});

// نسخ المحتوى المخصص
document.getElementById("copyCustomButton")?.addEventListener("click", () => {
  try {
    const boxes = document.querySelectorAll(
      "#customContentText .single-text-box"
    );
    if (boxes.length === 0) {
      return showNotification("لا يوجد محتوى مخصص لنسخه.", true);
    }

    const fullText = [...boxes]
      .map((b) => b.textContent.trim())
      .join("\n\n--------------------\n\n");

    navigator.clipboard
      .writeText(fullText)
      .then(() => showNotification("تم نسخ المحتوى المخصص بنجاح!"))
      .catch((err) => {
        console.error("خطأ في نسخ المحتوى المخصص:", err);
        showNotification("حدث خطأ أثناء نسخ المحتوى المخصص.", true);
      });
  } catch (err) {
    console.error("خطأ في نسخ المحتوى المخصص:", err);
    showNotification("حدث خطأ أثناء نسخ المحتوى المخصص.", true);
  }
});

// تصدير PDF عادي
document.getElementById("downloadPDF")?.addEventListener("click", () => {
  const boxes = document.querySelectorAll("#contentText .single-text-box");
  if (boxes.length === 0) {
    return showNotification("❌ لا يوجد محتوى لتحميله كـ PDF.", true);
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFont("Amiri-Regular");
  doc.setFontSize(14);

  let y = 20;

  boxes.forEach((box, i) => {
    const text = box.innerText.trim();
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 200, y, { align: "right" }); // عرض الصفحة 210mm
    y += lines.length * 8 + 10;

    if (y > 270 && i < boxes.length - 1) {
      doc.addPage();
      y = 20;
      doc.setFont("Amiri-Regular");
    }
  });

  doc.save("madad-content.pdf");
  showNotification("✅ تم تحميل المحتوى كملف PDF بنجاح!");
});

// تصدير word
document.getElementById("exportFormattedPDF")?.addEventListener("click", () => {
  const contentElement = document.getElementById("contentText");

  if (!contentElement || contentElement.innerText.trim() === "") {
    showNotification("❌ لا يوجد محتوى لتصديره كـ Word.", true);
    return;
  }

  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'></head><body>`;
  const footer = `</body></html>`;

  const htmlContent = contentElement.innerHTML.replace(/\n/g, "<br>");
  const fullDocument = header + htmlContent + footer;

  const blob = new Blob(["\ufeff", fullDocument], {
    type: "application/msword",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "madad-content.doc";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  showNotification("✅ تم تصدير المحتوى كـ Word بنجاح!");
});

// إضافة تقييم النجوم
document.addEventListener("DOMContentLoaded", () => {
  const stars = document.querySelectorAll(".rating-stars .star");
  const ratingResult = document.getElementById("ratingResult");

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const value = parseInt(star.getAttribute("data-value"));

      // إزالة التحديد من جميع النجوم
      stars.forEach((s) => s.classList.remove("selected"));

      // تحديد النجوم حتى النجمة المختارة
      for (let i = 0; i < value; i++) {
        stars[i].classList.add("selected");
      }

      // عرض نتيجة التقييم
      ratingResult.textContent = `شكراً لك! لقد قمت بتقييم الموقع بـ ${value} نجوم.`;

      // يمكن إرسال التقييم إلى قاعدة البيانات هنا إذا لزم الأمر
    });
  });
});
