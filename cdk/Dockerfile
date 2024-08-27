FROM amazonlinux:latest

# Python installation
RUN yum update && yum install python3 -y && yum install python3-pip -y && pip3 install boto3 && \
    yum install gzip -y && yum install tar -y

RUN curl -L -o install-tl-unx.tar.gz https://mirror.ctan.org/systems/texlive/tlnet/install-tl-unx.tar.gz

RUN yum install -y perl

ADD cvGenerator/ ./cvGenerator/

RUN ./cvGenerator/install.sh

ENV PATH="$PATH:/latex/bin/x86_64-linux"

# Latex packages
RUN tlmgr update --self && tlmgr install booktabs textgreek etoolbox cbfonts-fd

RUN pip3 install awslambdaric

ENTRYPOINT ["python3", "-m", "awslambdaric"]

CMD ["cvGenerator/generator.handler"]