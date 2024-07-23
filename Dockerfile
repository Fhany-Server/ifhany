FROM archlinux:latest

# Create user and directories
RUN groupadd -r ifhany
RUN useradd -r -m -g ifhany ifhany
RUN mkdir /app
RUN chown -R ifhany:ifhany /app

# ---------- Root ---------- #
USER root

ARG PACMAN_PARALLELDOWNLOADS=5
RUN pacman-key --init \
    && pacman -Sy --noconfirm --noprogressbar --quiet --needed pacman-contrib \
    && sed -i "s/^ParallelDownloads.*/ParallelDownloads = ${PACMAN_PARALLELDOWNLOADS}/g" /etc/pacman.conf

# Install basic tools
RUN pacman -Syu --noconfirm base base-devel git sudo go wget

# ---------- ifhany ---------- #
USER ifhany

# Install Yay
WORKDIR /home/ifhany
RUN git clone https://aur.archlinux.org/yay.git
WORKDIR /home/ifhany/yay
RUN makepkg --noconfirm

# ---------- Root ---------- #
USER root

RUN pacman -U --noconfirm /home/ifhany/yay/*.pkg.tar.zst
RUN yay -Syyuu --noconfirm

RUN yay -S npm --noconfirm
RUN yay -S yarn --noconfirm

ENV TERM=xterm
ENV FORCE_COLOR=true

# ---------- ifhany ---------- #
USER ifhany


WORKDIR /app