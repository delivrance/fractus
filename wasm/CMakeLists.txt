cmake_minimum_required(VERSION 3.13)
project(fractus)
set(CMAKE_CXX_STANDARD 20)

set(SOURCE_FILES fractus.cpp fractus.h)
include_directories(/Users/dan/emsdk/upstream/emscripten/system/include)

add_executable(fractus ${SOURCE_FILES})