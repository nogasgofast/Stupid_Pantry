FROM tiangolo/uwsgi-nginx-flask:python3.7
MAINTAINER Gene Guido "nogasgofast@gmail.com"
COPY . /app
WORKDIR /app
RUN apt update -y && \
   apt install -y zbar-tools && \
   pip install -r ./requirements.txt
