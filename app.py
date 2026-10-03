import streamlit as st
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import torch.nn.functional as F


# ============================================================
# CONFIGURATION
# ============================================================

st.set_page_config(
    page_title="TruLens",
    page_icon="🔍",
    layout="wide"
)

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

MODEL_PATH = "trulens_v2_best.pth"


# ============================================================
# CUSTOM CSS
# ============================================================

st.markdown("""
<style>

.main {
    background-color: #f8fafc;
}

.block-container {
    max-width: 1100px;
    padding-top: 2rem;
}

.hero {
    text-align: center;
    padding: 20px 0 30px 0;
}

.hero h1 {
    font-size: 3.2rem;
    margin-bottom: 5px;
}

.hero p {
    font-size: 1.15rem;
    color: #64748b;
}

.result-card {
    padding: 25px;
    border-radius: 18px;
    background: white;
    color: #111827;
    border: 1px solid #e2e8f0;
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
    text-align: center;
}

.result-card h1,
.result-card h2,
.result-card p {
    color: #111827;
}

.metric-card {
    padding: 18px;
    border-radius: 14px;
    background: white;
    color: #111827;
    border: 1px solid #e2e8f0;
    text-align: center;
}

.metric-value {
    font-size: 1.7rem;
    font-weight: 700;
    color: #111827;
}

.metric-label {
    color: #64748b;
    font-size: 0.9rem;
}

.footer {
    text-align: center;
    color: #64748b;
    padding: 35px 0 10px 0;
}

</style>
""", unsafe_allow_html=True)


# ============================================================
# IMAGE TRANSFORMATION
# ============================================================

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# LOAD MODEL
# ============================================================

@st.cache_resource
def load_model():

    model = models.efficientnet_b0(weights=None)

    num_features = model.classifier[1].in_features

    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(num_features, 2)
    )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE
    )

    model.load_state_dict(
        checkpoint["model_state_dict"]
    )

    model.to(DEVICE)
    model.eval()

    return model


model = load_model()


# ============================================================
# PREDICTION
# ============================================================

def predict(image):

    image_tensor = transform(image)
    image_tensor = image_tensor.unsqueeze(0)
    image_tensor = image_tensor.to(DEVICE)

    with torch.no_grad():

        output = model(image_tensor)

        probabilities = F.softmax(
            output,
            dim=1
        )[0]

    # Class mapping:
    # 0 = AI-generated
    # 1 = Real

    ai_probability = probabilities[0].item()
    real_probability = probabilities[1].item()

    if ai_probability >= real_probability:

        prediction = "AI-GENERATED"
        confidence = ai_probability

    else:

        prediction = "REAL"
        confidence = real_probability

    return (
        prediction,
        confidence,
        ai_probability,
        real_probability
    )


# ============================================================
# HEADER
# ============================================================

st.markdown("""
<div class="hero">

<h1>🔍 TruLens</h1>

<p>
Intelligent Visual Authenticity Detection System
</p>

</div>
""", unsafe_allow_html=True)


st.markdown(
    """
    <div style="text-align:center;">
    TruLens analyzes visual patterns using a deep learning model
    to estimate whether an image is AI-generated or real.
    </div>
    """,
    unsafe_allow_html=True
)

st.write("")


# ============================================================
# UPLOAD
# ============================================================

uploaded_file = st.file_uploader(
    "Upload an image for analysis",
    type=[
        "jpg",
        "jpeg",
        "png",
        "webp"
    ]
)


if uploaded_file:

    image = Image.open(
        uploaded_file
    ).convert("RGB")

    col1, col2 = st.columns(
        [1, 1],
        gap="large"
    )


    # --------------------------------------------------------
    # IMAGE
    # --------------------------------------------------------

    with col1:

        st.subheader("Uploaded Image")

        st.image(
            image,
            use_container_width=True
        )


    # --------------------------------------------------------
    # ANALYSIS
    # --------------------------------------------------------

    with col2:

        st.subheader("Analysis")

        if st.button(
            "🔎 Analyze Image",
            type="primary",
            use_container_width=True
        ):

            with st.spinner(
                "Analyzing visual patterns..."
            ):

                (
                    prediction,
                    confidence,
                    ai_probability,
                    real_probability
                ) = predict(image)


            st.write("")


            # ------------------------------------------------
            # RESULT
            # ------------------------------------------------

            if prediction == "REAL":

                st.success(
                    "### ✅ REAL IMAGE"
                )

            else:

                st.warning(
                    "### 🤖 AI-GENERATED IMAGE"
                )


            st.markdown(
                f"""
                <div class="result-card">

                <h2>{prediction}</h2>

                <p style="font-size:1.2rem;">
                Confidence
                </p>

                <h1>
                {confidence * 100:.2f}%
                </h1>

                </div>
                """,
                unsafe_allow_html=True
            )


            st.write("")


            # ------------------------------------------------
            # PROBABILITIES
            # ------------------------------------------------

            c1, c2 = st.columns(2)


            with c1:

                st.markdown(
                    f"""
                    <div class="metric-card">

                    <div class="metric-value">
                    {ai_probability * 100:.2f}%
                    </div>

                    <div class="metric-label">
                    AI-Generated Probability
                    </div>

                    </div>
                    """,
                    unsafe_allow_html=True
                )


            with c2:

                st.markdown(
                    f"""
                    <div class="metric-card">

                    <div class="metric-value">
                    {real_probability * 100:.2f}%
                    </div>

                    <div class="metric-label">
                    Real Probability
                    </div>

                    </div>
                    """,
                    unsafe_allow_html=True
                )


            st.write("")


            # ------------------------------------------------
            # INTERPRETATION
            # ------------------------------------------------

            st.subheader(
                "Interpretation"
            )


            if confidence >= 0.90:

                reliability = "High"

            elif confidence >= 0.70:

                reliability = "Moderate"

            else:

                reliability = "Low"


            st.info(
                f"""
                **Detection confidence:** {reliability}

                The model identified visual patterns that are
                more strongly associated with **{prediction.lower()}**
                imagery.

                This result represents a model prediction and should
                not be treated as absolute proof of image origin.
                """
            )


# ============================================================
# MODEL INFORMATION
# ============================================================

st.divider()

st.subheader("About TruLens")

info1, info2, info3 = st.columns(3)


with info1:

    st.markdown(
        """
        **🧠 Deep Learning**

        EfficientNet-B0 convolutional neural
        network trained for binary image
        authenticity classification.
        """
    )


with info2:

    st.markdown(
        """
        **📊 Model Performance**

        99.10% validation accuracy on the
        balanced AI-vs-Real validation set.
        """
    )


with info3:

    st.markdown(
        """
        **🔬 Two-Class Detection**

        The model estimates probabilities
        for AI-generated and real imagery.
        """
    )


# ============================================================
# FOOTER
# ============================================================

st.markdown(
    """
    <div class="footer">

    TruLens — Intelligent Visual Authenticity Detection System

    <br>

    Machine Learning Project

    </div>
    """,
    unsafe_allow_html=True
)