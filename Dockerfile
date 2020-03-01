FROM tiangolo/uwsgi-nginx-flask:python3.7
MAINTAINER Gene Guido "nogasgofast@gmail.com"
COPY ./static ./templates ./requirements.txt ./main.py ./sp_api.py ./sp_database.py /app
WORKDIR /app
RUN apt update -y && \
   apt install -y zbar-tools && \
   pip install -r ./requirements.txt
