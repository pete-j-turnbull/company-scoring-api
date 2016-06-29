# company-scoring-api

## Setup
 - docker build . -t company-scoring-api
 - docker run -p 8888:5000 -d company-scoring-api

Access the api at http://localhost:8888/scoreCompany?companyNumber={companyNumber}

Alternatively, run:
 - npm i
 - npm start (requires node installation)



Live version at http://whimz.co/

## Docs
 - scoreCompany?companyName={companyName}
 - scoreCompany?companyNumber={companyNumber}

