"use client"

import { useTemplate } from "./TemplateContext"

const YearSelector = () => {
    const { startYear, endYear, setStartYear, setEndYear } = useTemplate()

    const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString())

    const handleStartYearChange = (e) => {
        setStartYear(e.target.value)
    }

    const handleEndYearChange = (e) => {
        setEndYear(e.target.value)
    }

    return (
        <>
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <select className="input input-bordered w-full" value={startYear} onChange={handleStartYearChange}>
                    <option value="">Select start year</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <select className="input input-bordered w-full" value={endYear} onChange={handleEndYearChange}>
                    <option value="">Select end year</option>
                    <option value="Current">Current</option>
                    {years.map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>
        </>
    )
}

export default YearSelector
