import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
from text_processing import preprocess_text
import joblib

# === Load English and Swahili datasets ===
# English dataset: tab-separated label and text
eng = pd.read_csv('dataset/SMSSpams.txt', sep='\t', names=['label', 'text'])
# Swahili dataset: tab-separated label and text
swa = pd.read_csv('dataset/swahili_sms.txt', sep='\t', names=['label', 'text'])
# link datasets
lnk = pd.read_csv('dataset/whistle_spam_dataset.txt', sep='\t', names=['label', 'text'])

# Combine datasets
data = pd.concat([eng, swa, lnk], ignore_index=True)

# Drop missing, trim whitespace
data.dropna(subset=['text'], inplace=True)
data['text'] = data['text'].astype(str).str.strip()
data.reset_index(drop=True, inplace=True)

# Preprocess all texts up front
data['text'] = data['text'].apply(preprocess_text)

# Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(
    data['text'], data['label'], test_size=0.2, random_state=42
)

# Build a pipeline with CountVectorizer and MultinomialNB
model = Pipeline([
    ('vectorizer', CountVectorizer(ngram_range=(1, 4))),

    ('classifier', MultinomialNB())
])

# Train and evaluate
model.fit(X_train, y_train)
y_pred = model.predict(X_test)
print(classification_report(y_test, y_pred))

# Save the combined model
joblib.dump(model, 'scam_detector_model.pkl')
print(" Combined English & Swahili model saved as scam_detector_model.pkl")

