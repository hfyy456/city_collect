/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-07-22 00:35:30
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-07-22 00:39:01
 */
import { ElMessage } from 'element-plus';

const STORAGE_KEY = 'xhs_cookie';

/**
 * 获取存储的Cookie
 * @returns 存储的Cookie字符串或空字符串
 */
export const getCookie = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (error) {
    ElMessage.error('获取Cookie失败，请检查浏览器存储权限');
    return '';
  }
};

/**
 * 设置并存储Cookie
 * @param value 要存储的Cookie值
 */
export const setCookie = (value: string): void => {
  try {
    if (value) {
      localStorage.setItem(STORAGE_KEY, value);
      ElMessage.success('Cookie已保存');
    } else {
      localStorage.removeItem(STORAGE_KEY);
      ElMessage.success('Cookie已清除');
    }
  } catch (error) {
    ElMessage.error('保存Cookie失败，请检查浏览器存储权限');
  }
};

/**
 * 清除存储的Cookie
 */
export const clearCookie = (): void => {
  setCookie('');
};

/**
 * 检查是否存在Cookie
 * @returns 是否存在Cookie
 */
export const hasCookie = (): boolean => {
  return getCookie().length > 0;
};