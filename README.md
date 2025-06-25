# Fast Guide to get started
- to run the scam filter chat web
- first setup the npm weights

```
npm i
```
- then run the project 

```
npm run dev
```

- to start the scam filter api 
- first install the requirements
 
```
python -m venv scam-filter

source scam-filter/bin/activate.fsh

cd scam-filter/

pip install -r requirements.txt


```

- then start the api
```

python -m uvicorn api:app --host 0.0.0.0 --port 8000 --reload
```