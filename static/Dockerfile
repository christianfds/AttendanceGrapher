FROM python:3.13.2-alpine

COPY . /static

EXPOSE 6000

CMD python -m http.server 6000 --bind 0.0.0.0 --directory /static
