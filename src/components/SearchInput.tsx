// Ô tìm kiếm có nút xoá. Trước đây mỗi trang danh sách tự chép lại một bản.
import { useEffect, useState } from 'react';
import IconSearch from './Icon/IconSearch';
import IconX from './Icon/IconX';

type SearchInputProps = {
    /** Gọi sau khi người dùng ngừng gõ, tránh lọc lại ở mỗi phím */
    onSearch: (keyword: string) => void;
    placeholder?: string;
    delay?: number;
};

function SearchInput({ onSearch, placeholder = 'Tìm kiếm', delay = 400 }: SearchInputProps) {
    const [value, setValue] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => onSearch(value.trim()), delay);
        return () => clearTimeout(timer);
    }, [value, delay, onSearch]);

    return (
        <div className="relative">
            <input type="text" className="form-input peer py-2 ltr:pr-11 rtl:pl-11" placeholder={placeholder} value={value} onChange={(event) => setValue(event.target.value)} />
            <button
                type="button"
                aria-label={value ? 'Xoá từ khoá' : 'Tìm kiếm'}
                className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]"
                onClick={() => setValue('')}
            >
                {value ? <IconX className="mx-auto" /> : <IconSearch className="mx-auto" />}
            </button>
        </div>
    );
}

export default SearchInput;
